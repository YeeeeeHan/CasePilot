import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { save } from "@tauri-apps/plugin-dialog";
import { AppLayout, type SidebarView } from "./components/layout/AppLayout";
import {
  RepositoryPanel,
  type RepositoryFile,
} from "./components/sidebar/RepositoryPanel";
import {
  ProjectTree,
  type ProjectArtifact,
} from "./components/sidebar/ProjectTree";
import { Toaster } from "./components/ui/sonner";
import { Workbench, type WorkbenchMode } from "./components/workbench";
import {
  Inspector,
  MasterIndex,
  ProjectSwitcher,
  type IndexEntry,
  type InspectorFile,
  type ProjectCase,
  type SelectionSource,
} from "./components/zones";
import {
  useInvoke,
  type Case as DbCase,
  type Document as DbDocument,
  type CaseFile,
  type Artifact,
} from "./hooks/useInvoke";
import {
  createCoverPage,
  createDividerPage,
  createDocumentEntry,
  createSectionBreak,
  getTotalPages,
  recalculatePageRanges,
  reorderArray,
} from "./lib/pagination";

export interface Document {
  id: string;
  name: string;
  caseId: string;
}

export interface Case {
  id: string;
  name: string;
  documents: Document[];
}

function App() {
  const {
    listCases,
    createCase,
    deleteCase,
    listDocuments,
    extractPdfMetadata,
    // v2.0 API
    listFiles,
    createFile,
    updateFile,
    deleteFile,
    listArtifacts,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    createEntry,
    deleteEntry,
    reorderEntries,
    // Legacy (still needed for some features)
    compileBundle,
    saveMasterIndex,
    loadMasterIndex,
  } = useInvoke();

  // Compile state
  const [isCompiling, setIsCompiling] = useState(false);

  // Case/document state
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sidebar view state (project-tree or files)
  const [sidebarView, setSidebarView] = useState<SidebarView>("project-tree");

  // Repository state (source files bucket)
  const [repositoryFiles, setRepositoryFiles] = useState<CaseFile[]>([]);
  const [repositoryExpanded, setRepositoryExpanded] = useState(true);

  // Artifacts state (affidavits and bundles)
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  // Active bundle artifact ID (auto-created per case)
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null);

  // Derive workbench mode from active artifact
  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId);
  const workbenchMode: WorkbenchMode =
    activeArtifact?.artifact_type === "affidavit" ? "affidavit" : "bundle";

  // Zone C: Master index state
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);

  // Track which file IDs are linked to the bundle (derived from indexEntries)
  const linkedFileIds = new Set(
    indexEntries
      .filter((e) => e.rowType === "document" && e.fileId)
      .map((e) => e.fileId),
  );

  // Unified selection state (drives Inspector)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectionSource, setSelectionSource] =
    useState<SelectionSource | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Store previous index entries for undo functionality
  const previousIndexEntriesRef = useRef<IndexEntry[]>([]);

  // Debounce timer ref for saving master index
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get or create the default bundle artifact for a case
  const getOrCreateDefaultBundle = useCallback(
    async (caseId: string): Promise<string | null> => {
      const artifacts = await listArtifacts(caseId);
      const existingBundle = artifacts.find(
        (a) => a.artifact_type === "bundle",
      );
      if (existingBundle) {
        return existingBundle.id;
      }
      // Create default bundle
      const newBundle = await createArtifact(caseId, "bundle", "Master Bundle");
      return newBundle?.id ?? null;
    },
    [listArtifacts, createArtifact],
  );

  // Load cases on mount (run only once)
  useEffect(() => {
    const loadCasesOnMount = async () => {
      setIsLoading(true);
      const dbCases = await listCases();

      // Load documents for each case
      const casesWithDocs: Case[] = await Promise.all(
        dbCases.map(async (c: DbCase) => {
          const docs = await listDocuments(c.id);
          return {
            id: c.id,
            name: c.name,
            documents: docs.map((d: DbDocument) => ({
              id: d.id,
              name: d.name,
              caseId: d.case_id,
            })),
          };
        }),
      );

      setCases(casesWithDocs);

      // Auto-select first case if exists and load its data
      if (casesWithDocs.length > 0) {
        const firstCaseId = casesWithDocs[0].id;
        setActiveCaseId(firstCaseId);

        // Load repository files for the first case (v2.0 API)
        const repoFiles = await listFiles(firstCaseId);
        setRepositoryFiles(repoFiles);

        // Load artifacts for the first case
        const caseArtifacts = await listArtifacts(firstCaseId);
        setArtifacts(caseArtifacts);

        // Get or create default bundle
        const bundleId = await getOrCreateDefaultBundle(firstCaseId);
        setActiveBundleId(bundleId);
        // Set default active artifact to bundle
        setActiveArtifactId(bundleId);

        // Try to load saved master index first
        const savedIndexJson = await loadMasterIndex(firstCaseId);
        if (savedIndexJson) {
          try {
            const savedEntries = JSON.parse(savedIndexJson) as IndexEntry[];
            setIndexEntries(savedEntries);
          } catch (e) {
            console.error("Failed to parse saved master index:", e);
            setIndexEntries([]);
          }
        } else {
          setIndexEntries([]);
        }
      }

      setIsLoading(false);
    };

    loadCasesOnMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Auto-save master index when entries change (debounced)
  useEffect(() => {
    if (!activeCaseId || indexEntries.length === 0) return;

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Debounce save by 500ms
    saveTimerRef.current = setTimeout(() => {
      const json = JSON.stringify(indexEntries);
      saveMasterIndex(activeCaseId, json);
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [indexEntries, activeCaseId, saveMasterIndex]);

  // Handle case creation
  const handleCreateCase = useCallback(async () => {
    const newCase = await createCase("New Case");
    if (newCase) {
      setCases((prev) => [
        ...prev,
        { id: newCase.id, name: newCase.name, documents: [] },
      ]);
      setActiveCaseId(newCase.id);
      // Create default bundle for the new case
      const bundleId = await getOrCreateDefaultBundle(newCase.id);
      setActiveBundleId(bundleId);
      setActiveArtifactId(bundleId);
      // Reload artifacts (will now include the new bundle)
      const caseArtifacts = await listArtifacts(newCase.id);
      setArtifacts(caseArtifacts);
      // Clear state for new case
      setRepositoryFiles([]);
      setIndexEntries([]);
    }
  }, [createCase, getOrCreateDefaultBundle, listArtifacts]);

  // Handle case deletion
  const handleDeleteCase = useCallback(
    async (caseId: string) => {
      const success = await deleteCase(caseId);
      if (success) {
        // Remove from local state
        setCases((prev) => prev.filter((c) => c.id !== caseId));

        // If deleted case was active, select another case
        if (activeCaseId === caseId) {
          const remainingCases = cases.filter((c) => c.id !== caseId);
          if (remainingCases.length > 0) {
            const nextCaseId = remainingCases[0].id;
            setActiveCaseId(nextCaseId);
            // Load repository files for the new active case (v2.0 API)
            const repoFiles = await listFiles(nextCaseId);
            setRepositoryFiles(repoFiles);
            // Get or create bundle and load saved index
            const bundleId = await getOrCreateDefaultBundle(nextCaseId);
            setActiveBundleId(bundleId);
            const savedIndexJson = await loadMasterIndex(nextCaseId);
            if (savedIndexJson) {
              try {
                const savedEntries = JSON.parse(savedIndexJson) as IndexEntry[];
                setIndexEntries(savedEntries);
              } catch {
                setIndexEntries([]);
              }
            } else {
              setIndexEntries([]);
            }
          } else {
            setActiveCaseId(null);
            setActiveBundleId(null);
            setRepositoryFiles([]);
            setIndexEntries([]);
          }
        }
        toast.success("Case deleted");
      } else {
        toast.error("Failed to delete case");
      }
    },
    [
      activeCaseId,
      cases,
      deleteCase,
      listFiles,
      loadMasterIndex,
      getOrCreateDefaultBundle,
    ],
  );

  // Handle case selection
  const handleSelectCase = useCallback(
    async (caseId: string) => {
      setActiveCaseId(caseId);
      // Reset selection state
      setSelectedFileId(null);
      setSelectionSource(null);

      // Load repository files from database (v2.0 API)
      const repoFiles = await listFiles(caseId);
      setRepositoryFiles(repoFiles);

      // Load artifacts for the case
      const caseArtifacts = await listArtifacts(caseId);
      setArtifacts(caseArtifacts);

      // Get or create bundle
      const bundleId = await getOrCreateDefaultBundle(caseId);
      setActiveBundleId(bundleId);
      setActiveArtifactId(bundleId);

      // Try to load saved master index first
      const savedIndexJson = await loadMasterIndex(caseId);
      if (savedIndexJson) {
        try {
          const savedEntries = JSON.parse(savedIndexJson) as IndexEntry[];
          setIndexEntries(savedEntries);
          return; // Successfully loaded from saved index
        } catch (e) {
          console.error("Failed to parse saved master index:", e);
        }
      }

      // No saved index
      setIndexEntries([]);
    },
    [listFiles, listArtifacts, loadMasterIndex, getOrCreateDefaultBundle],
  );

  // Handle file drop in repository
  const handleFileDrop = useCallback(
    async (filePaths: string[]) => {
      if (!activeCaseId) {
        toast.error("No active case selected");
        return;
      }

      console.log(
        "[App] handleFileDrop called with",
        filePaths.length,
        "files:",
        filePaths,
      );

      // Create files in database using v2.0 API
      console.log("[App] Creating files for", filePaths.length, "files");
      const results = await Promise.all(
        filePaths.map(async (path) => {
          const name = path.split(/[\\/]/).pop() || path;
          console.log(
            "[App] Calling createFile for:",
            path,
            "with name:",
            name,
          );
          const result = await createFile(activeCaseId, path, name);
          console.log("[App] createFile result:", result);
          return result;
        }),
      );

      console.log("[App] All createFile results:", results);

      // Separate successful and failed creations
      const successfulFiles: CaseFile[] = [];
      const errors: string[] = [];

      for (const result of results) {
        if (result.file) {
          successfulFiles.push(result.file);
        } else if (result.error) {
          errors.push(result.error);
        }
      }

      console.log("[App] Successful files:", successfulFiles.length);
      console.log("[App] Errors:", errors);

      // Add to repository (optimistic update)
      if (successfulFiles.length > 0) {
        setRepositoryFiles((prev) => [...prev, ...successfulFiles]);
      }

      // Extract metadata asynchronously and update page count
      successfulFiles.forEach(async (file) => {
        const metadata = await extractPdfMetadata(file.path);

        if (metadata) {
          // Update page count
          const updated = await updateFile(file.id, metadata.page_count);

          if (updated) {
            // Update local state
            setRepositoryFiles((prev) =>
              prev.map((f) => (f.id === file.id ? updated : f)),
            );
          }
        }
      });

      // Show appropriate toast based on results
      if (errors.length > 0 && successfulFiles.length === 0) {
        // All failed
        toast.error(`Failed to add files: ${errors[0]}`);
      } else if (errors.length > 0) {
        // Partial success
        toast.warning(
          `Added ${successfulFiles.length} file(s), ${errors.length} failed`,
          { description: errors[0] },
        );
      } else if (successfulFiles.length > 0) {
        // All succeeded
        toast.success(`Added ${successfulFiles.length} file(s) to repository`);
      }
    },
    [activeCaseId, createFile, extractPdfMetadata, updateFile],
  );

  // Handle moving file from repository to index
  const handleAddToIndex = useCallback(
    async (fileId: string) => {
      const file = repositoryFiles.find((f) => f.id === fileId);
      if (!file || !activeCaseId || !activeBundleId) return;

      // Calculate page numbers - find last document entry (skip section breaks)
      let lastDocPageEnd = 0;
      for (let i = indexEntries.length - 1; i >= 0; i--) {
        if (indexEntries[i].rowType === "document") {
          lastDocPageEnd = indexEntries[i].pageEnd;
          break;
        }
      }
      const pageStart = lastDocPageEnd + 1 || 1;
      const pageCount = file.page_count || 1;
      const pageEnd = pageStart + pageCount - 1;
      const sequenceOrder = indexEntries.filter(
        (e) => e.rowType === "document",
      ).length;

      // Create entry in v2.0 API (link file to bundle)
      const entry = await createEntry(
        activeBundleId,
        sequenceOrder,
        "file",
        file.id,
        undefined, // no config_json for files
        undefined, // no ref_artifact_id
        `Tab ${sequenceOrder + 1}`, // label override
      );

      if (!entry) {
        toast.error("Failed to add document to index");
        return;
      }

      // Create index entry for UI
      const newEntry: IndexEntry = {
        id: entry.id,
        rowType: "document",
        fileId: file.path,
        description: file.original_name,
        date: "",
        pageStart,
        pageEnd,
        disputed: false,
      };

      setIndexEntries((prev) => [...prev, newEntry]);

      // Note: linkedFileIds is derived from indexEntries, so it will update automatically
      toast.success(`Added "${file.original_name}" to bundle`);
    },
    [repositoryFiles, indexEntries, activeCaseId, activeBundleId, createEntry],
  );

  // Handle entry selection in Master Index
  const handleSelectEntry = useCallback((entryId: string) => {
    setSelectedFileId(entryId);
    setSelectionSource("master-index");
    setInspectorOpen(true);
  }, []);

  // Handle file selection from Repository
  const handleSelectRepositoryFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    setSelectionSource("repository");
    setInspectorOpen(true);
  }, []);

  // Handle description change (also handles section label for section breaks)
  const handleDescriptionChange = useCallback(
    (entryId: string, description: string) => {
      setIndexEntries((prev) =>
        prev.map((e) => {
          if (e.id !== entryId) return e;
          if (e.rowType === "section-break") {
            return { ...e, sectionLabel: description };
          }
          return { ...e, description };
        }),
      );
    },
    [],
  );

  // Handle date change
  const handleDateChange = useCallback((entryId: string, date: string) => {
    setIndexEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, date } : e)),
    );
  }, []);

  // Handle disputed toggle
  const handleDisputedChange = useCallback(
    (entryId: string, disputed: boolean) => {
      setIndexEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, disputed } : e)),
      );
    },
    [],
  );

  // Handle drag-to-reorder in Master Index
  const handleReorderEntries = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!activeCaseId || !activeBundleId) return;

      // Store current state for potential undo
      previousIndexEntriesRef.current = indexEntries;

      // Reorder the array
      let reordered = reorderArray(indexEntries, fromIndex, toIndex);

      // Recalculate page ranges based on new order (handles section breaks)
      reordered = recalculatePageRanges(reordered);

      // Update state optimistically
      setIndexEntries(reordered);

      // Persist reorder to database (only document entries, using v2.0 API)
      const entryIds = reordered
        .filter((e) => e.rowType === "document")
        .map((e) => e.id);
      const result = await reorderEntries(activeBundleId, entryIds);

      if (result.length === 0 && entryIds.length > 0) {
        // Revert on failure
        setIndexEntries(previousIndexEntriesRef.current);
        toast.error("Failed to reorder. Changes reverted.");
        return;
      }

      // Show toast with undo option
      toast.success(`Moved to position ${toIndex + 1}`, {
        description: "All page numbers recalculated automatically.",
        action: {
          label: "Undo",
          onClick: async () => {
            if (previousIndexEntriesRef.current.length > 0) {
              const previousIds = previousIndexEntriesRef.current
                .filter((e) => e.rowType === "document")
                .map((e) => e.id);
              await reorderEntries(activeBundleId, previousIds);
              setIndexEntries(previousIndexEntriesRef.current);
              previousIndexEntriesRef.current = [];
              toast.info("Reorder undone");
            }
          },
        },
        duration: 5000,
      });
    },
    [indexEntries, activeCaseId, activeBundleId, reorderEntries],
  );

  // Check if a file is referenced in any affidavit (for delete protection)
  const isFileReferencedInAffidavit = useCallback(
    (fileId: string): string | null => {
      for (const artifact of artifacts) {
        if (artifact.artifact_type !== "affidavit" || !artifact.content_json) {
          continue;
        }
        try {
          const parsed = JSON.parse(artifact.content_json);
          const content = parsed.content || "";
          const fileIdRegex = new RegExp(`fileId["\s:]+["']?${fileId}`, "i");
          if (fileIdRegex.test(content)) {
            return artifact.name;
          }
        } catch {
          // Ignore parse errors
        }
      }
      return null;
    },
    [artifacts],
  );

  // Handle deleting a repository file
  const handleDeleteRepositoryFile = useCallback(
    async (fileId: string) => {
      const file = repositoryFiles.find((f) => f.id === fileId);
      if (!file) return;

      // Check if file is referenced in any affidavit (delete protection)
      const referencingAffidavit = isFileReferencedInAffidavit(fileId);
      if (referencingAffidavit) {
        toast.error(`Cannot delete: Referenced in "${referencingAffidavit}"`, {
          description:
            "Remove the exhibit reference first, then delete the file.",
        });
        return;
      }

      // If it's linked to the bundle, also remove those entries
      const linkedEntries = indexEntries.filter(
        (e) => e.rowType === "document" && e.fileId === file.path,
      );
      if (linkedEntries.length > 0) {
        // Remove from index entries and recalculate
        const updatedEntries = indexEntries.filter(
          (e) => !(e.rowType === "document" && e.fileId === file.path),
        );
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);
        // Also delete the entries from DB
        for (const entry of linkedEntries) {
          await deleteEntry(entry.id);
        }
      }

      // Delete file from database (v2.0 API)
      const success = await deleteFile(fileId);
      if (success) {
        // Remove from repository
        setRepositoryFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success("File deleted");
      } else {
        toast.error("Failed to delete file");
      }
    },
    [
      repositoryFiles,
      indexEntries,
      deleteFile,
      deleteEntry,
      isFileReferencedInAffidavit,
    ],
  );

  // Handle removing an entry from master index (demote back to repository)
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const entry = indexEntries.find((e) => e.id === entryId);

      // For section breaks, cover pages, and dividers - just remove from local state (no DB update needed)
      if (
        entry?.rowType === "section-break" ||
        entry?.rowType === "cover-page" ||
        entry?.rowType === "divider"
      ) {
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);

        const typeLabels: Record<string, string> = {
          "section-break": "Section break",
          "cover-page": "Cover page",
          divider: "Blank page",
        };
        toast.success(`${typeLabels[entry.rowType]} removed`);
        return;
      }

      // For documents, delete the entry from the bundle (v2.0 API)
      const success = await deleteEntry(entryId);
      if (success) {
        // Remove from index entries and recalculate
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);

        // Note: linkedFileIds is derived from indexEntries, so it will update automatically
        toast.success("Document removed from bundle");
      } else {
        toast.error("Failed to remove document from bundle");
      }
    },
    [indexEntries, deleteEntry],
  );

  // Handle bundle compilation
  const handleCompileBundle = useCallback(async () => {
    if (!activeCaseId) {
      toast.error("No active case selected");
      return;
    }

    if (indexEntries.length === 0) {
      toast.error(
        "No documents in bundle. Add documents to the Master Index first.",
      );
      return;
    }

    const activeCase = cases.find((c) => c.id === activeCaseId);
    const bundleName = activeCase?.name.replace(/\s+/g, "_") || "Bundle";

    // Show save dialog
    const selectedPath = await save({
      defaultPath: `${bundleName}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
      title: "Save Bundle As",
    });

    if (!selectedPath) {
      // User cancelled
      return;
    }

    setIsCompiling(true);
    toast.info("Compiling bundle...", { duration: 2000 });

    try {
      const result = await compileBundle(
        activeCaseId,
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

      console.log("Bundle compiled:", result);
    } catch (error) {
      console.error("Compile error:", error);
      toast.error("Failed to compile bundle");
    } finally {
      setIsCompiling(false);
    }
  }, [activeCaseId, indexEntries, cases, compileBundle]);

  // Handle inserting a section break
  const handleInsertSectionBreak = useCallback(() => {
    // Generate next section label (A, B, C...)
    const sectionCount = indexEntries.filter(
      (e) => e.rowType === "section-break",
    ).length;
    const nextLetter = String.fromCharCode(65 + sectionCount); // A, B, C...
    const defaultLabel = `TAB ${nextLetter}`;

    const newSectionBreak: IndexEntry = createSectionBreak(defaultLabel);
    setIndexEntries((prev) => [...prev, newSectionBreak]);
    toast.success(`Added section break: ${defaultLabel}`);
  }, [indexEntries]);

  // Handle inserting a cover page
  const handleInsertCoverPage = useCallback(() => {
    const newCoverPage: IndexEntry = createCoverPage();
    setIndexEntries((prev) => {
      // Insert cover page at the beginning
      const updated = [newCoverPage, ...prev];
      return recalculatePageRanges(updated);
    });
    // Auto-select the new cover page
    setSelectedFileId(newCoverPage.id);
    setSelectionSource("master-index");
    toast.success("Added cover page");
  }, []);

  // Handle inserting a blank page
  const handleInsertDivider = useCallback(() => {
    const dividerCount = indexEntries.filter(
      (e) => e.rowType === "divider",
    ).length;
    const defaultTitle = `Blank Page ${dividerCount + 1}`;

    const newDivider: IndexEntry = createDividerPage(defaultTitle);
    setIndexEntries((prev) => {
      const updated = [...prev, newDivider];
      return recalculatePageRanges(updated);
    });
    // Auto-select the new divider
    setSelectedFileId(newDivider.id);
    setSelectionSource("master-index");
    toast.success(`Added blank page: ${defaultTitle}`);
  }, [indexEntries]);

  // Handle inserting a table of contents
  const handleInsertTableOfContents = useCallback(() => {
    // For now, just show a toast - TOC generation will be implemented later
    toast.info("Table of Contents template coming soon!");
  }, []);

  // Handle adding a file to the Master Index (via drag-drop or double-click)
  const handleAddFileToIndex = useCallback(
    (fileData: {
      id: string;
      name: string;
      path: string;
      pageCount?: number;
    }) => {
      // Check if file is already in the index
      const isAlreadyInIndex = indexEntries.some(
        (e) => e.fileId === fileData.id,
      );
      if (isAlreadyInIndex) {
        toast.info(`"${fileData.name}" is already in the Master Index`);
        return;
      }

      // Create a new document entry
      const newEntry = createDocumentEntry(
        fileData.id,
        fileData.name,
        fileData.pageCount || 1,
      );

      // Add to index and recalculate page ranges
      setIndexEntries((prev) => {
        const updated = [...prev, newEntry];
        return recalculatePageRanges(updated);
      });

      // Auto-select the new entry
      setSelectedFileId(newEntry.id);
      setSelectionSource("master-index");
      toast.success(`Added "${fileData.name}" to Master Index`);
    },
    [indexEntries],
  );

  // Handle file double-click from Repository
  const handleFileDoubleClick = useCallback(
    (fileId: string) => {
      const file = repositoryFiles.find((f) => f.id === fileId);
      if (!file) return;

      handleAddFileToIndex({
        id: file.id,
        name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
        path: file.path,
        pageCount: file.page_count ?? undefined,
      });
    },
    [repositoryFiles, handleAddFileToIndex],
  );

  // Handle TipTap content changes (cover pages, dividers)
  // Triggers pagination ripple when page count changes
  const handleTiptapContentChange = useCallback(
    (entryId: string, content: string, pageCount: number) => {
      setIndexEntries((prev) => {
        const updated = prev.map((e) =>
          e.id === entryId
            ? { ...e, tiptapContent: content, generatedPageCount: pageCount }
            : e,
        );
        return recalculatePageRanges(updated);
      });
    },
    [],
  );

  // ============================================================================
  // ARTIFACT HANDLERS (Phase 4A)
  // ============================================================================

  // Handle artifact selection (from Project Tree)
  const handleSelectArtifact = useCallback((artifactId: string) => {
    setActiveArtifactId(artifactId);
    // Clear selection when switching artifacts
    setSelectedFileId(null);
    setSelectionSource(null);
  }, []);

  // Handle artifact creation (from Project Tree)
  const handleCreateArtifact = useCallback(
    async (type: "affidavit" | "bundle", name: string, initials?: string) => {
      if (!activeCaseId) {
        toast.error("No active case selected");
        return;
      }

      // Store initials in content_json for affidavits
      const contentJson =
        type === "affidavit" && initials
          ? JSON.stringify({ initials, content: "" })
          : undefined;

      const newArtifact = await createArtifact(
        activeCaseId,
        type,
        name,
        contentJson,
      );

      if (newArtifact) {
        setArtifacts((prev) => [...prev, newArtifact]);
        setActiveArtifactId(newArtifact.id);
        toast.success(`Created ${type}: ${name}`);
      } else {
        toast.error(`Failed to create ${type}`);
      }
    },
    [activeCaseId, createArtifact],
  );

  // Handle artifact deletion (from Project Tree)
  const handleDeleteArtifact = useCallback(
    async (artifactId: string) => {
      const artifact = artifacts.find((a) => a.id === artifactId);
      if (!artifact) return;

      // Don't allow deleting the default bundle
      if (artifact.id === activeBundleId) {
        toast.error("Cannot delete the default bundle");
        return;
      }

      const success = await deleteArtifact(artifactId);
      if (success) {
        setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
        // If deleted artifact was active, switch to bundle
        if (activeArtifactId === artifactId) {
          setActiveArtifactId(activeBundleId);
        }
        toast.success(`Deleted ${artifact.artifact_type}: ${artifact.name}`);
      } else {
        toast.error("Failed to delete artifact");
      }
    },
    [artifacts, activeBundleId, activeArtifactId, deleteArtifact],
  );

  // Handle affidavit content change (from AffidavitEditor)
  const handleAffidavitContentChange = useCallback(
    async (artifactId: string, content: string) => {
      const artifact = artifacts.find((a) => a.id === artifactId);
      if (!artifact) return;

      // Preserve initials when updating content
      let contentJson: string;
      try {
        const existing = artifact.content_json
          ? JSON.parse(artifact.content_json)
          : {};
        contentJson = JSON.stringify({ ...existing, content });
      } catch {
        contentJson = JSON.stringify({ content });
      }

      const updated = await updateArtifact(artifactId, undefined, contentJson);
      if (updated) {
        setArtifacts((prev) =>
          prev.map((a) => (a.id === artifactId ? updated : a)),
        );
      }
    },
    [artifacts, updateArtifact],
  );

  // Handle affidavit initials change (from AffidavitEditor)
  const handleAffidavitInitialsChange = useCallback(
    async (artifactId: string, initials: string) => {
      const artifact = artifacts.find((a) => a.id === artifactId);
      if (!artifact) return;

      // Preserve content when updating initials
      let contentJson: string;
      try {
        const existing = artifact.content_json
          ? JSON.parse(artifact.content_json)
          : {};
        contentJson = JSON.stringify({ ...existing, initials });
      } catch {
        contentJson = JSON.stringify({ initials });
      }

      const updated = await updateArtifact(artifactId, undefined, contentJson);
      if (updated) {
        setArtifacts((prev) =>
          prev.map((a) => (a.id === artifactId ? updated : a)),
        );
        toast.success(`Initials updated to "${initials}"`);
      }
    },
    [artifacts, updateArtifact],
  );

  // Convert cases to ProjectCase format
  const projectCases: ProjectCase[] = cases.map((c) => ({
    id: c.id,
    name: c.name,
    initials: "", // Will be auto-generated by ProjectSwitcher
  }));

  // Convert artifacts to ProjectArtifact format
  const projectArtifacts: ProjectArtifact[] = artifacts.map((a) => {
    let initials: string | undefined;
    if (a.artifact_type === "affidavit" && a.content_json) {
      try {
        const parsed = JSON.parse(a.content_json);
        initials = parsed.initials;
      } catch {
        // Ignore parse errors
      }
    }
    return {
      id: a.id,
      name: a.name,
      type: a.artifact_type,
      initials,
    };
  });

  // Get active artifact data for Workbench
  const getActiveArtifactForWorkbench = () => {
    if (!activeArtifact) return null;

    let initials: string | undefined;
    let content: string | undefined;

    if (activeArtifact.content_json) {
      try {
        const parsed = JSON.parse(activeArtifact.content_json);
        initials = parsed.initials;
        content = parsed.content;
      } catch {
        // If not JSON, treat as raw content
        content = activeArtifact.content_json;
      }
    }

    return {
      id: activeArtifact.id,
      name: activeArtifact.name,
      type: activeArtifact.artifact_type,
      content,
      initials,
    };
  };

  // Convert repository files to RepositoryFile format (v2.0 API)
  const repoFilesForPanel: RepositoryFile[] = repositoryFiles.map((file) => ({
    id: file.id,
    name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
    filePath: file.path,
    pageCount: file.page_count ?? undefined,
    isLinked: linkedFileIds.has(file.path),
  }));

  // Convert repository files to AvailableFile format for AffidavitEditor
  const availableFilesForEditor = repositoryFiles.map((file) => ({
    id: file.id,
    name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
    path: file.path,
    pageCount: file.page_count ?? undefined,
  }));

  // Get selected file for Inspector
  const getSelectedFile = (): InspectorFile | null => {
    if (!selectedFileId) return null;

    if (selectionSource === "repository") {
      const file = repositoryFiles.find((f) => f.id === selectedFileId);
      if (!file) return null;
      return {
        id: file.id,
        name: file.original_name || file.path.split(/[\\/]/).pop() || "Unknown",
        filePath: file.path,
        pageCount: file.page_count ?? undefined,
        isLinked: linkedFileIds.has(file.path),
      };
    }

    if (selectionSource === "master-index") {
      const entry = indexEntries.find((e) => e.id === selectedFileId);
      if (!entry || entry.rowType === "section-break") return null;
      return {
        id: entry.id,
        name: entry.description,
        filePath: entry.fileId || "",
        pageCount: entry.pageEnd - entry.pageStart + 1,
        isLinked: true,
      };
    }

    return null;
  };

  // Get selected entry for Inspector (when selecting from Master Index)
  const getSelectedEntry = (): IndexEntry | null => {
    if (!selectedFileId || selectionSource !== "master-index") return null;
    return indexEntries.find((e) => e.id === selectedFileId) || null;
  };

  if (isLoading) {
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
            activeCaseId={activeCaseId}
            onSelectCase={handleSelectCase}
            onCreateCase={handleCreateCase}
            onDeleteCase={handleDeleteCase}
          />
        }
        sidebar={
          sidebarView === "project-tree" ? (
            <ProjectTree
              artifacts={projectArtifacts}
              activeArtifactId={activeArtifactId}
              onSelectArtifact={handleSelectArtifact}
              onCreateArtifact={handleCreateArtifact}
              onDeleteArtifact={handleDeleteArtifact}
            />
          ) : (
            <RepositoryPanel
              files={repoFilesForPanel}
              expanded={repositoryExpanded}
              onToggle={setRepositoryExpanded}
              onFileSelect={handleSelectRepositoryFile}
              onFileDelete={handleDeleteRepositoryFile}
              onFileDrop={handleFileDrop}
              onFileDoubleClick={handleFileDoubleClick}
              selectedFileId={
                selectionSource === "repository" ? selectedFileId : null
              }
            />
          )
        }
        workbench={
          <Workbench
            mode={workbenchMode}
            activeArtifact={getActiveArtifactForWorkbench()}
            availableFiles={availableFilesForEditor}
            masterIndex={
              <MasterIndex
                entries={indexEntries}
                selectedEntryId={
                  selectionSource === "master-index" ? selectedFileId : null
                }
                onSelectEntry={handleSelectEntry}
                onReorder={handleReorderEntries}
                onDeleteEntry={handleDeleteEntry}
                onCompileBundle={handleCompileBundle}
                onInsertSectionBreak={handleInsertSectionBreak}
                onInsertCoverPage={handleInsertCoverPage}
                onInsertDivider={handleInsertDivider}
                onInsertTableOfContents={handleInsertTableOfContents}
                onFileDropped={handleAddFileToIndex}
                isCompiling={isCompiling}
              />
            }
            entries={indexEntries}
            selectedEntry={getSelectedEntry()}
            totalBundlePages={getTotalPages(indexEntries)}
            onContentChange={handleTiptapContentChange}
            onAffidavitContentChange={handleAffidavitContentChange}
            onAffidavitInitialsChange={handleAffidavitInitialsChange}
          />
        }
        inspector={
          <Inspector
            selectedFile={getSelectedFile()}
            selectedEntry={getSelectedEntry()}
            selectionSource={selectionSource}
            onDescriptionChange={handleDescriptionChange}
            onDateChange={handleDateChange}
            onDisputedChange={handleDisputedChange}
            onAddToBundle={handleAddToIndex}
            onRemoveFromBundle={handleDeleteEntry}
            onClose={() => setInspectorOpen(false)}
          />
        }
        inspectorOpen={inspectorOpen}
        sidebarView={sidebarView}
        onSidebarViewChange={setSidebarView}
      />
      <Toaster />
    </>
  );
}

export default App;
