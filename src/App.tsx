import { confirm, save } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { extractExhibitFileIds } from "./components/editor/ExhibitNode";
import { AppLayout } from "./components/layout/AppLayout";
import {
  RepositoryPanel,
  type RepositoryFile,
} from "./components/sidebar/RepositoryPanel";
import { Toaster } from "./components/ui/sonner";
import { Onboarding } from "./components/views/Onboarding";
import {
  Workbench,
  type AffidavitEditorHandle,
  type AvailableFile,
  type WorkbenchMode,
} from "./components/workbench";
import {
  CreateCaseDialog,
  Inspector,
  MasterIndex,
  ProjectSwitcher,
  type IndexEntry,
  type InspectorFile,
  type ProjectCase,
  type SelectionSource,
} from "./components/zones";
import { useCaseManager } from "./hooks/features/useCaseManager";
import { useFileRepository } from "./hooks/features/useFileRepository";
import { useMasterIndex } from "./hooks/features/useMasterIndex";
import { useInvoke } from "./hooks/useInvoke";
import { getTotalPages, recalculatePageRanges } from "./lib/pagination";

function App() {
  const { compileBundle, createEntry, deleteEntry } = useInvoke();

  // Initialize hooks
  const caseManager = useCaseManager();
  const fileRepository = useFileRepository();
  const masterIndex = useMasterIndex();

  // Compile state
  const [isCompiling, setIsCompiling] = useState(false);

  // Ref to affidavit editor for inserting exhibits from Inspector
  const editorRef = useRef<AffidavitEditorHandle>(null);

  // Unified selection state - supports multi-select for repository files
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectionSource, setSelectionSource] =
    useState<SelectionSource | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Primary selected file (last selected, used for inspector)
  const selectedFileId =
    selectedFileIds.size > 0 ? Array.from(selectedFileIds).pop()! : null;

  // Derive linked file IDs from index entries (bundle mode)
  const linkedFileIds = new Set(
    masterIndex.indexEntries
      .filter((e) => e.rowType === "document" && e.fileId)
      .map((e) => e.fileId),
  );

  // Derive referenced file IDs from affidavit content (affidavit mode)
  const referencedFileIds = useMemo(() => {
    if (
      caseManager.activeCase?.case_type === "affidavit" &&
      caseManager.activeCase.content_json
    ) {
      try {
        const parsed = JSON.parse(caseManager.activeCase.content_json);
        // Content could be a string (TipTap JSON) or an object
        const contentStr =
          typeof parsed.content === "string"
            ? parsed.content
            : JSON.stringify(parsed.content || "");

        // Use the proper helper function that handles both JSON and HTML formats
        const fileIds = extractExhibitFileIds(contentStr);
        return new Set(fileIds);
      } catch {
        // Ignore parse errors
      }
    }
    return new Set<string>();
  }, [caseManager.activeCase?.case_type, caseManager.activeCase?.content_json]);

  // Derive workbench mode from active case
  const workbenchMode: WorkbenchMode =
    caseManager.activeCase?.case_type === "affidavit" ? "affidavit" : "bundle";

  // Convert repository files to RepositoryFile format (moved up for use in callbacks)
  // Grey out files that are either linked to bundle OR referenced in affidavit
  const repoFilesForPanel: RepositoryFile[] = useMemo(
    () =>
      fileRepository.repositoryFiles.map((file) => ({
        id: file.id,
        name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
        filePath: file.path,
        pageCount: file.page_count ?? undefined,
        isLinked: linkedFileIds.has(file.id) || referencedFileIds.has(file.id),
      })),
    [fileRepository.repositoryFiles, linkedFileIds, referencedFileIds],
  );

  // Load files and entries when case changes
  useEffect(() => {
    const loadCaseData = async () => {
      if (caseManager.activeCaseId && !caseManager.isLoading) {
        const files = await fileRepository.loadFiles(caseManager.activeCaseId);
        await masterIndex.loadEntriesFromDb(caseManager.activeCaseId, files);
        setSelectedFileIds(new Set());
        setSelectionSource(null);
      }
    };
    loadCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseManager.activeCaseId, caseManager.isLoading]);

  // Handle case selection
  const handleSelectCase = useCallback(
    async (caseId: string) => {
      caseManager.handleSelectCase(caseId);
    },
    [caseManager],
  );

  // Dialog state for case creation
  const [createCaseDialogOpen, setCreateCaseDialogOpen] = useState(false);
  const [pendingCaseType, setPendingCaseType] = useState<
    "bundle" | "affidavit" | null
  >(null);

  // Handle case creation - open dialog
  const handleCreateCase = useCallback((caseType: "bundle" | "affidavit") => {
    setPendingCaseType(caseType);
    setCreateCaseDialogOpen(true);
  }, []);

  // Handle case creation confirmation from dialog
  const handleCreateCaseConfirm = useCallback(
    async (name: string) => {
      if (!pendingCaseType) return;

      const newCase = await caseManager.handleCreateCase(pendingCaseType, name);
      if (newCase) {
        fileRepository.clearFiles();
        masterIndex.clearEntries();
      }
      setPendingCaseType(null);
    },
    [pendingCaseType, caseManager, fileRepository, masterIndex],
  );

  // Handle case deletion
  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      const nextCaseId = await caseManager.handleDeleteCase(caseId);
      if (nextCaseId) {
        const files = await fileRepository.loadFiles(nextCaseId);
        await masterIndex.loadEntriesFromDb(nextCaseId, files);
      } else {
        fileRepository.clearFiles();
        masterIndex.clearEntries();
      }
    },
    [caseManager, fileRepository, masterIndex],
  );

  // Check if a file is referenced in any affidavit
  const isFileReferencedInAffidavit = useCallback(
    (fileId: string): string | null => {
      if (
        caseManager.activeCase?.case_type === "affidavit" &&
        caseManager.activeCase.content_json
      ) {
        try {
          const parsed = JSON.parse(caseManager.activeCase.content_json);
          // Content could be a string (TipTap JSON) or an object
          const contentStr =
            typeof parsed.content === "string"
              ? parsed.content
              : JSON.stringify(parsed.content || "");

          // Use the proper helper function that handles both JSON and HTML formats
          const fileIds = extractExhibitFileIds(contentStr);
          if (fileIds.includes(fileId)) {
            return caseManager.activeCase.name;
          }
        } catch {
          // Ignore parse errors
        }
      }
      return null;
    },
    [caseManager.activeCase],
  );

  // Handle file drop
  const handleFileDrop = useCallback(
    async (filePaths: string[]) => {
      await fileRepository.handleFileDrop(caseManager.activeCaseId, filePaths);
    },
    [caseManager.activeCaseId, fileRepository],
  );

  // Handle file rename (placeholder - future implementation)
  const handleFileRename = useCallback(
    async (fileId: string, newName: string) => {
      // TODO: Implement file rename via Tauri command
      toast.info(`Rename "${newName}" - Coming soon!`);
      console.log("Rename file:", fileId, "to", newName);
    },
    [],
  );

  // Handle create folder
  const handleCreateFolder = useCallback(
    (name: string, parentId: string | null) => {
      const folder = fileRepository.createFolder(name, parentId);
      toast.success(`Created folder "${folder.name}"`);
    },
    [fileRepository],
  );

  // Handle delete folder
  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      fileRepository.deleteFolder(folderId);
      toast.success("Folder deleted");
    },
    [fileRepository],
  );

  // Handle rename folder
  const handleRenameFolder = useCallback(
    (folderId: string, newName: string) => {
      fileRepository.renameFolder(folderId, newName);
      toast.success(`Folder renamed to "${newName}"`);
    },
    [fileRepository],
  );

  // Handle file deletion with linked entry cleanup
  const handleDeleteRepositoryFile = useCallback(
    async (fileId: string) => {
      const file = fileRepository.repositoryFiles.find((f) => f.id === fileId);
      if (!file) return;

      const referencingAffidavit = isFileReferencedInAffidavit(fileId);
      if (referencingAffidavit) {
        toast.error(`Cannot delete: Referenced in "${referencingAffidavit}"`, {
          description:
            "Remove the exhibit reference first, then delete the file.",
        });
        return;
      }

      // Remove linked entries
      const linkedEntries = masterIndex.indexEntries.filter(
        (e) => e.rowType === "document" && e.fileId === file.id,
      );

      if (linkedEntries.length > 0) {
        const updatedEntries = masterIndex.indexEntries.filter(
          (e) => !(e.rowType === "document" && e.fileId === file.id),
        );
        const recalculated = recalculatePageRanges(updatedEntries);
        masterIndex.setIndexEntries(recalculated);

        for (const entry of linkedEntries) {
          await deleteEntry(entry.id);
        }
      }

      await fileRepository.handleDeleteRepositoryFile(fileId);
    },
    [fileRepository, masterIndex, isFileReferencedInAffidavit, deleteEntry],
  );

  // Handle entry selection in Master Index (single select only)
  const handleSelectEntry = useCallback((entryId: string) => {
    setSelectedFileIds(new Set([entryId]));
    setSelectionSource("master-index");
    setInspectorOpen(true);
  }, []);

  // Handle file selection from Repository (supports multi-select)
  const handleSelectRepositoryFile = useCallback(
    (
      fileId: string,
      modifiers?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean },
    ) => {
      setSelectionSource("repository");
      setInspectorOpen(true);

      // Get flat list of files for range selection
      const flatFileIds = repoFilesForPanel.map((f) => f.id);

      if (modifiers?.shiftKey && selectedFileIds.size > 0) {
        // Shift+Click: range selection
        const lastSelectedId = Array.from(selectedFileIds).pop()!;
        const lastIndex = flatFileIds.indexOf(lastSelectedId);
        const currentIndex = flatFileIds.indexOf(fileId);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          const rangeIds = flatFileIds.slice(start, end + 1);
          setSelectedFileIds(
            new Set([...Array.from(selectedFileIds), ...rangeIds]),
          );
        } else {
          setSelectedFileIds(new Set([fileId]));
        }
      } else if (modifiers?.metaKey || modifiers?.ctrlKey) {
        // Cmd/Ctrl+Click: toggle selection
        setSelectedFileIds((prev) => {
          const next = new Set(prev);
          if (next.has(fileId)) {
            next.delete(fileId);
          } else {
            next.add(fileId);
          }
          return next;
        });
      } else {
        // Regular click: single selection
        setSelectedFileIds(new Set([fileId]));
      }
    },
    [selectedFileIds, repoFilesForPanel],
  );

  // Handle keyboard navigation in repository
  const handleRepositoryKeyDown = useCallback(
    (direction: "up" | "down", modifiers?: { shiftKey?: boolean }) => {
      const flatFileIds = repoFilesForPanel.map((f) => f.id);
      if (flatFileIds.length === 0) return;

      const currentId = selectedFileId;
      const currentIndex = currentId ? flatFileIds.indexOf(currentId) : -1;

      let newIndex: number;
      if (direction === "up") {
        newIndex =
          currentIndex <= 0 ? flatFileIds.length - 1 : currentIndex - 1;
      } else {
        newIndex =
          currentIndex >= flatFileIds.length - 1 ? 0 : currentIndex + 1;
      }

      const newFileId = flatFileIds[newIndex];

      if (modifiers?.shiftKey && selectedFileIds.size > 0) {
        // Shift+Arrow: expand selection range
        // Get the anchor (first selected) and expand to new index
        const firstSelectedId = Array.from(selectedFileIds)[0];
        const anchorIndex = flatFileIds.indexOf(firstSelectedId);

        if (anchorIndex !== -1) {
          const start = Math.min(anchorIndex, newIndex);
          const end = Math.max(anchorIndex, newIndex);
          const rangeIds = flatFileIds.slice(start, end + 1);
          setSelectedFileIds(new Set(rangeIds));
        } else {
          setSelectedFileIds(new Set([newFileId]));
        }
      } else {
        // No shift: clear selection and select only the new file
        setSelectedFileIds(new Set([newFileId]));
      }

      setSelectionSource("repository");
      setInspectorOpen(true);
    },
    [selectedFileId, selectedFileIds, repoFilesForPanel],
  );

  // Handle file double-click from Repository
  // In affidavit mode: insert exhibit into editor
  // In bundle mode: add to master index
  const handleFileDoubleClick = useCallback(
    (fileId: string) => {
      const file = fileRepository.repositoryFiles.find((f) => f.id === fileId);
      if (!file) return;

      const fileData: AvailableFile = {
        id: file.id,
        name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
        path: file.path,
        pageCount: file.page_count ?? undefined,
      };

      if (workbenchMode === "affidavit" && editorRef.current) {
        // In affidavit mode, insert exhibit into editor
        editorRef.current.insertExhibit(fileData);
      } else {
        // In bundle mode, add to master index
        handleAddFileToIndex(fileData);
      }
    },
    [fileRepository.repositoryFiles, workbenchMode],
  );

  // Handle adding a file to the Master Index
  const handleAddFileToIndex = useCallback(
    async (fileData: {
      id: string;
      name: string;
      path: string;
      pageCount?: number;
    }) => {
      if (!caseManager.activeCaseId) {
        toast.error("No active case");
        return;
      }

      const isAlreadyInIndex = masterIndex.indexEntries.some(
        (e) => e.fileId === fileData.id,
      );
      if (isAlreadyInIndex) {
        toast.info(`"${fileData.name}" is already in the Master Index`);
        return;
      }

      const sequenceOrder = masterIndex.indexEntries.length;
      const configJson = JSON.stringify({
        description: fileData.name,
        date: "",
        disputed: false,
      });

      const dbEntry = await createEntry(
        caseManager.activeCaseId,
        sequenceOrder,
        "file",
        fileData.id,
        configJson,
        `Tab ${sequenceOrder + 1}`,
      );

      if (!dbEntry) {
        toast.error("Failed to add document to bundle");
        return;
      }

      const newEntry: IndexEntry = {
        id: dbEntry.id,
        rowType: "document",
        fileId: fileData.id,
        filePath: fileData.path,
        description: fileData.name,
        date: "",
        pageStart: 1,
        pageEnd: fileData.pageCount || 1,
        disputed: false,
      };

      masterIndex.setIndexEntries((prev) => {
        const updated = [...prev, newEntry];
        return recalculatePageRanges(updated);
      });

      setSelectedFileIds(new Set([newEntry.id]));
      setSelectionSource("master-index");
      toast.success(`Added "${fileData.name}" to Master Index`);
    },
    [masterIndex, caseManager.activeCaseId, createEntry],
  );

  // Handle add to bundle/affidavit from inspector (single file)
  const handleAddToBundle = useCallback(
    async (fileId: string) => {
      if (!caseManager.activeCaseId) return;
      const file = fileRepository.repositoryFiles.find((f) => f.id === fileId);
      if (!file) return;

      // In affidavit mode, insert exhibit into editor
      if (workbenchMode === "affidavit" && editorRef.current) {
        const availableFile: AvailableFile = {
          id: file.id,
          name:
            file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
          path: file.path,
          pageCount: file.page_count ?? undefined,
        };
        editorRef.current.insertExhibit(availableFile);
        return;
      }

      // In bundle mode, add to master index
      await masterIndex.handleAddToIndex(caseManager.activeCaseId, file);
    },
    [
      caseManager.activeCaseId,
      fileRepository.repositoryFiles,
      masterIndex,
      workbenchMode,
    ],
  );

  // Handle adding multiple files to bundle/affidavit (multi-select)
  const handleAddMultipleToBundle = useCallback(
    async (fileIds: string[]) => {
      if (!caseManager.activeCaseId || fileIds.length === 0) return;

      const filesToAdd = fileRepository.repositoryFiles.filter((f) =>
        fileIds.includes(f.id),
      );

      if (workbenchMode === "affidavit" && editorRef.current) {
        // In affidavit mode, insert each exhibit
        for (const file of filesToAdd) {
          const availableFile: AvailableFile = {
            id: file.id,
            name:
              file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
            path: file.path,
            pageCount: file.page_count ?? undefined,
          };
          editorRef.current.insertExhibit(availableFile);
        }
        toast.success(`Added ${filesToAdd.length} exhibit(s)`);
      } else {
        // In bundle mode, add each to master index
        let addedCount = 0;
        for (const file of filesToAdd) {
          // Skip if already in index
          const isAlreadyInIndex = masterIndex.indexEntries.some(
            (e) => e.fileId === file.id,
          );
          if (!isAlreadyInIndex) {
            await masterIndex.handleAddToIndex(caseManager.activeCaseId, file);
            addedCount++;
          }
        }
        if (addedCount > 0) {
          toast.success(`Added ${addedCount} file(s) to Master Index`);
        } else {
          toast.info("All selected files are already in the Master Index");
        }
      }
    },
    [
      caseManager.activeCaseId,
      fileRepository.repositoryFiles,
      masterIndex,
      workbenchMode,
    ],
  );

  // Handle deleting multiple files (multi-select)
  const handleDeleteMultipleFiles = useCallback(
    async (fileIds: string[]) => {
      if (fileIds.length === 0) return;

      // Check for protected files (referenced in affidavit)
      const protectedFiles: string[] = [];
      const deletableIds: string[] = [];

      for (const fileId of fileIds) {
        const referencingAffidavit = isFileReferencedInAffidavit(fileId);
        if (referencingAffidavit) {
          const file = fileRepository.repositoryFiles.find(
            (f) => f.id === fileId,
          );
          protectedFiles.push(
            file?.original_name || file?.path.split(/[\\/]/).pop() || "Unknown",
          );
        } else {
          deletableIds.push(fileId);
        }
      }

      if (protectedFiles.length > 0) {
        toast.error(
          `Cannot delete ${protectedFiles.length} file(s) referenced in affidavit`,
          {
            description: protectedFiles.slice(0, 3).join(", "),
          },
        );
      }

      if (deletableIds.length === 0) return;

      // Check which files are in the master index
      const filesInIndex = deletableIds.filter((fileId) =>
        masterIndex.indexEntries.some(
          (e) => e.rowType === "document" && e.fileId === fileId,
        ),
      );

      // Build confirmation message
      let confirmMessage = `Delete ${deletableIds.length} file(s) from the repository?`;
      if (filesInIndex.length > 0) {
        confirmMessage += `\n\n${filesInIndex.length} file(s) will also be removed from the Master Index.`;
      }

      // Show confirmation dialog
      const confirmed = await confirm(confirmMessage, {
        title: "Confirm Delete",
        kind: "warning",
      });

      if (!confirmed) return;

      // Delete each file (this also removes from master index)
      for (const fileId of deletableIds) {
        await handleDeleteRepositoryFile(fileId);
      }

      setSelectedFileIds(new Set());
      toast.success(`Deleted ${deletableIds.length} file(s)`);
    },
    [
      isFileReferencedInAffidavit,
      fileRepository.repositoryFiles,
      handleDeleteRepositoryFile,
      masterIndex.indexEntries,
    ],
  );

  // Handle reorder with case ID
  const handleReorderEntries = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!caseManager.activeCaseId) return;
      await masterIndex.handleReorderEntries(
        caseManager.activeCaseId,
        fromIndex,
        toIndex,
      );
    },
    [caseManager.activeCaseId, masterIndex],
  );

  // Handle section break insert with case ID
  const handleInsertSectionBreak = useCallback(async () => {
    if (!caseManager.activeCaseId) {
      toast.error("No active case");
      return;
    }
    await masterIndex.handleInsertSectionBreak(caseManager.activeCaseId);
  }, [caseManager.activeCaseId, masterIndex]);

  // Handle cover page insert with case ID
  const handleInsertCoverPage = useCallback(async () => {
    if (!caseManager.activeCaseId) {
      toast.error("No active case");
      return;
    }
    const entry = await masterIndex.handleInsertCoverPage(
      caseManager.activeCaseId,
    );
    if (entry) {
      setSelectedFileIds(new Set([entry.id]));
      setSelectionSource("master-index");
    }
  }, [caseManager.activeCaseId, masterIndex]);

  // Handle divider insert with case ID
  const handleInsertDivider = useCallback(async () => {
    if (!caseManager.activeCaseId) {
      toast.error("No active case");
      return;
    }
    const entry = await masterIndex.handleInsertDivider(
      caseManager.activeCaseId,
    );
    if (entry) {
      setSelectedFileIds(new Set([entry.id]));
      setSelectionSource("master-index");
    }
  }, [caseManager.activeCaseId, masterIndex]);

  // Handle TOC insertion (placeholder)
  const handleInsertTableOfContents = useCallback(() => {
    toast.info("Table of Contents template coming soon!");
  }, []);

  // Handle bundle compilation
  const handleCompileBundle = useCallback(async () => {
    if (!caseManager.activeCaseId) {
      toast.error("No active case selected");
      return;
    }

    if (masterIndex.indexEntries.length === 0) {
      toast.error(
        "No documents in bundle. Add documents to the Master Index first.",
      );
      return;
    }

    const bundleName =
      caseManager.activeCase?.name.replace(/\s+/g, "_") || "Bundle";

    const selectedPath = await save({
      defaultPath: `${bundleName}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      title: "Save Bundle As",
    });

    if (!selectedPath) return;

    setIsCompiling(true);
    toast.info("Compiling bundle...", { duration: 2000 });

    try {
      const result = await compileBundle(
        caseManager.activeCaseId,
        bundleName,
        selectedPath,
      );

      if (!result) {
        toast.error("Failed to compile bundle");
        return;
      }

      if (!result.success) {
        toast.error(result.errors.join(", ") || "Compilation failed");
        return;
      }

      toast.success(`Bundle compiled: ${result.total_pages} pages`, {
        description: `Saved to: ${selectedPath}`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Compile error:", error);
      toast.error("Failed to compile bundle");
    } finally {
      setIsCompiling(false);
    }
  }, [
    caseManager.activeCaseId,
    caseManager.activeCase,
    masterIndex.indexEntries,
    compileBundle,
  ]);

  // Handle case content changes (affidavit mode)
  const handleCaseContentChange = useCallback(
    async (caseId: string, content: string) => {
      const caseToUpdate = caseManager.cases.find((c) => c.id === caseId);
      if (!caseToUpdate) return;

      let contentJson: string;
      try {
        const existing = caseToUpdate.content_json
          ? JSON.parse(caseToUpdate.content_json)
          : {};
        contentJson = JSON.stringify({ ...existing, content });
      } catch {
        contentJson = JSON.stringify({ content });
      }

      caseManager.updateCaseContent(caseId, contentJson);
    },
    [caseManager],
  );

  // Handle case initials changes (affidavit mode)
  const handleCaseInitialsChange = useCallback(
    async (caseId: string, initials: string) => {
      const caseToUpdate = caseManager.cases.find((c) => c.id === caseId);
      if (!caseToUpdate) return;

      let contentJson: string;
      try {
        const existing = caseToUpdate.content_json
          ? JSON.parse(caseToUpdate.content_json)
          : {};
        contentJson = JSON.stringify({ ...existing, initials });
      } catch {
        contentJson = JSON.stringify({ initials });
      }

      caseManager.updateCaseContent(caseId, contentJson);
      toast.success(`Initials updated to "${initials}"`);
    },
    [caseManager],
  );

  // Convert cases to ProjectCase format
  const projectCases: ProjectCase[] = caseManager.cases.map((c) => ({
    id: c.id,
    name: c.name,
    initials: "",
    case_type: c.case_type,
  }));

  // Get active case data for Workbench
  const getActiveCaseForWorkbench = () => {
    if (!caseManager.activeCase) return null;

    let initials: string | undefined;
    let content: string | undefined;

    if (caseManager.activeCase.content_json) {
      try {
        const parsed = JSON.parse(caseManager.activeCase.content_json);
        initials = parsed.initials;
        content = parsed.content;
      } catch {
        content = caseManager.activeCase.content_json;
      }
    }

    return {
      id: caseManager.activeCase.id,
      name: caseManager.activeCase.name,
      type: caseManager.activeCase.case_type,
      content,
      initials,
    };
  };

  // Convert repository files to AvailableFile format for AffidavitEditor
  const availableFilesForEditor = fileRepository.repositoryFiles.map(
    (file) => ({
      id: file.id,
      name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
      path: file.path,
      pageCount: file.page_count ?? undefined,
    }),
  );

  // Get selected file for Inspector
  const getSelectedFile = (): InspectorFile | null => {
    if (!selectedFileId) return null;

    if (selectionSource === "repository") {
      const file = fileRepository.repositoryFiles.find(
        (f) => f.id === selectedFileId,
      );
      if (!file) return null;
      return {
        id: file.id,
        name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
        filePath: file.path,
        pageCount: file.page_count ?? undefined,
        isLinked: linkedFileIds.has(file.id) || referencedFileIds.has(file.id),
      };
    }

    if (selectionSource === "master-index") {
      const entry = masterIndex.indexEntries.find(
        (e) => e.id === selectedFileId,
      );
      if (!entry || entry.rowType === "section-break") return null;
      const file = fileRepository.repositoryFiles.find(
        (f) => f.id === entry.fileId,
      );
      return {
        id: entry.id,
        name: entry.description,
        filePath: file?.path || "",
        pageCount: entry.pageEnd - entry.pageStart + 1,
        isLinked: true,
      };
    }

    return null;
  };

  // Get selected entry for Inspector
  const getSelectedEntry = (): IndexEntry | null => {
    if (!selectedFileId || selectionSource !== "master-index") return null;
    return (
      masterIndex.indexEntries.find((e) => e.id === selectedFileId) || null
    );
  };

  if (caseManager.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <>
      <AppLayout
        projectSwitcher={
          <ProjectSwitcher
            cases={projectCases}
            activeCaseId={caseManager.activeCaseId}
            onSelectCase={handleSelectCase}
            onCreateCase={handleCreateCase}
            onDeleteCase={handleDeleteCase}
          />
        }
        sidebar={
          <RepositoryPanel
            files={repoFilesForPanel}
            folders={fileRepository.folders}
            fileFolderAssignments={fileRepository.fileFolderAssignments}
            expanded={fileRepository.repositoryExpanded}
            onToggle={fileRepository.setRepositoryExpanded}
            onFileSelect={handleSelectRepositoryFile}
            onFileDelete={handleDeleteRepositoryFile}
            onFileDrop={handleFileDrop}
            onFileDoubleClick={handleFileDoubleClick}
            onFileRename={handleFileRename}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onRenameFolder={handleRenameFolder}
            selectedFileIds={
              selectionSource === "repository" ? selectedFileIds : new Set()
            }
            onKeyboardNavigation={handleRepositoryKeyDown}
            onAddMultipleToBundle={handleAddMultipleToBundle}
            onDeleteMultiple={handleDeleteMultipleFiles}
            workbenchMode={workbenchMode}
          />
        }
        workbench={
          caseManager.cases.length === 0 ? (
            <Onboarding onCreateCase={handleCreateCase} />
          ) : (
            <Workbench
              mode={workbenchMode}
              activeCase={getActiveCaseForWorkbench()}
              availableFiles={availableFilesForEditor}
              editorRef={editorRef}
              masterIndex={
                <MasterIndex
                  entries={masterIndex.indexEntries}
                  selectedEntryId={
                    selectionSource === "master-index" ? selectedFileId : null
                  }
                  onSelectEntry={handleSelectEntry}
                  onReorder={handleReorderEntries}
                  onDeleteEntry={masterIndex.handleDeleteEntry}
                  onCompileBundle={handleCompileBundle}
                  onInsertSectionBreak={handleInsertSectionBreak}
                  onInsertCoverPage={handleInsertCoverPage}
                  onInsertDivider={handleInsertDivider}
                  onInsertTableOfContents={handleInsertTableOfContents}
                  onFileDropped={handleAddFileToIndex}
                  isCompiling={isCompiling}
                />
              }
              entries={masterIndex.indexEntries}
              selectedEntry={getSelectedEntry()}
              totalBundlePages={getTotalPages(masterIndex.indexEntries)}
              onContentChange={masterIndex.handleTiptapContentChange}
              onAffidavitContentChange={handleCaseContentChange}
              onAffidavitInitialsChange={handleCaseInitialsChange}
            />
          )
        }
        inspector={
          <Inspector
            mode={workbenchMode}
            selectedFile={getSelectedFile()}
            selectedEntry={getSelectedEntry()}
            selectionSource={selectionSource}
            onDescriptionChange={masterIndex.handleDescriptionChange}
            onDateChange={masterIndex.handleDateChange}
            onDisputedChange={masterIndex.handleDisputedChange}
            onAddToBundle={handleAddToBundle}
            onRemoveFromBundle={masterIndex.handleDeleteEntry}
            onClose={() => setInspectorOpen(false)}
          />
        }
        inspectorOpen={inspectorOpen}
      />
      <CreateCaseDialog
        open={createCaseDialogOpen}
        caseType={pendingCaseType}
        onOpenChange={setCreateCaseDialogOpen}
        onConfirm={handleCreateCaseConfirm}
      />
      <Toaster />
    </>
  );
}

export default App;
