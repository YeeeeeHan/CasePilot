import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { save } from "@tauri-apps/plugin-dialog";
import { AppLayout } from "./components/layout/AppLayout";
import {
  RepositoryPanel,
  type RepositoryFile,
} from "./components/sidebar/RepositoryPanel";
import { Toaster } from "./components/ui/sonner";
import { Workbench } from "./components/workbench";
import {
  Inspector,
  MasterIndex,
  ProjectSwitcher,
  type IndexEntry,
  type InspectorFile,
  type ProjectCase,
  type RowType,
  type SelectionSource,
} from "./components/zones";
import {
  useInvoke,
  type Case as DbCase,
  type Document as DbDocument,
  type Exhibit,
} from "./hooks/useInvoke";
import {
  createCoverPage,
  createDividerPage,
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
    listExhibits,
    listStagingFiles,
    createExhibit,
    updateExhibit,
    updateExhibitStatus,
    promoteToFundled,
    deleteExhibit,
    reorderExhibits,
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

  // Repository state (source files bucket)
  const [repositoryFiles, setRepositoryFiles] = useState<Exhibit[]>([]);
  const [repositoryExpanded, setRepositoryExpanded] = useState(true);

  // Zone C: Master index state
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);

  // Unified selection state (drives Inspector)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectionSource, setSelectionSource] =
    useState<SelectionSource | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Store previous index entries for undo functionality
  const previousIndexEntriesRef = useRef<IndexEntry[]>([]);

  // Debounce timer ref for saving master index
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

        // Load repository files for the first case
        const repoFiles = await listStagingFiles(firstCaseId);
        setRepositoryFiles(repoFiles);

        // Try to load saved master index first
        const savedIndexJson = await loadMasterIndex(firstCaseId);
        if (savedIndexJson) {
          try {
            const savedEntries = JSON.parse(savedIndexJson) as IndexEntry[];
            setIndexEntries(savedEntries);
          } catch (e) {
            console.error("Failed to parse saved master index:", e);
            // Fall back to loading from exhibits
            await loadEntriesFromExhibits(firstCaseId);
          }
        } else {
          // No saved index, load from bundled exhibits
          await loadEntriesFromExhibits(firstCaseId);
        }
      }

      async function loadEntriesFromExhibits(caseId: string) {
        const exhibits = await listExhibits(caseId);
        if (exhibits.length > 0) {
          let currentPage = 1;
          const entries: IndexEntry[] = exhibits.map((exhibit) => {
            const pageCount = exhibit.page_count || 1;
            const pageStart = currentPage;
            const pageEnd = currentPage + pageCount - 1;
            currentPage = pageEnd + 1;

            return {
              id: exhibit.id,
              rowType: "document" as RowType,
              fileId: exhibit.file_path,
              description: exhibit.description || exhibit.label || "",
              date: "",
              pageStart,
              pageEnd,
              disputed: false,
            };
          });
          setIndexEntries(entries);
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
      // Clear state for new case
      setRepositoryFiles([]);
      setIndexEntries([]);
    }
  }, [createCase]);

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
            // Load repository files and exhibits for the new active case
            const repoFiles = await listStagingFiles(nextCaseId);
            setRepositoryFiles(repoFiles);
            const exhibits = await listExhibits(nextCaseId);
            if (exhibits.length > 0) {
              let currentPage = 1;
              const entries: IndexEntry[] = exhibits.map((exhibit) => {
                const pageCount = exhibit.page_count || 1;
                const pageStart = currentPage;
                const pageEnd = currentPage + pageCount - 1;
                currentPage = pageEnd + 1;
                return {
                  id: exhibit.id,
                  rowType: "document" as RowType,
                  fileId: exhibit.file_path,
                  description: exhibit.description || exhibit.label || "",
                  date: "",
                  pageStart,
                  pageEnd,
                  disputed: false,
                };
              });
              setIndexEntries(entries);
            } else {
              setIndexEntries([]);
            }
          } else {
            setActiveCaseId(null);
            setRepositoryFiles([]);
            setIndexEntries([]);
          }
        }
        toast.success("Case deleted");
      } else {
        toast.error("Failed to delete case");
      }
    },
    [activeCaseId, cases, deleteCase, listStagingFiles, listExhibits],
  );

  // Handle case selection
  const handleSelectCase = useCallback(
    async (caseId: string) => {
      setActiveCaseId(caseId);
      // Reset selection state
      setSelectedFileId(null);
      setSelectionSource(null);

      // Load repository files from database
      const repoFiles = await listStagingFiles(caseId);
      setRepositoryFiles(repoFiles);

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

      // Fall back to loading from bundled exhibits
      const exhibits = await listExhibits(caseId);
      if (exhibits.length > 0) {
        let currentPage = 1;
        const entries: IndexEntry[] = exhibits.map((exhibit) => {
          const pageCount = exhibit.page_count || 1;
          const pageStart = currentPage;
          const pageEnd = currentPage + pageCount - 1;
          currentPage = pageEnd + 1;

          return {
            id: exhibit.id,
            rowType: "document" as RowType,
            fileId: exhibit.file_path,
            description: exhibit.description || exhibit.label || "",
            date: "",
            pageStart,
            pageEnd,
            disputed: false,
          };
        });
        setIndexEntries(entries);
      } else {
        setIndexEntries([]);
      }
    },
    [listExhibits, listStagingFiles, loadMasterIndex],
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

      // Create exhibits in database immediately
      console.log("[App] Creating exhibits for", filePaths.length, "files");
      const newExhibits = await Promise.all(
        filePaths.map(async (path) => {
          const name = path.split(/[\\/]/).pop() || path;
          console.log(
            "[App] Calling createExhibit for:",
            path,
            "with name:",
            name,
          );
          const result = await createExhibit(
            activeCaseId,
            path,
            "unprocessed", // Initial status (still used in DB)
            undefined, // No label yet
            undefined, // No sequence yet
            undefined, // No page count yet
            name, // Description: filename
          );
          console.log("[App] createExhibit result:", result);
          return result;
        }),
      );

      console.log("[App] All createExhibit results:", newExhibits);

      // Filter out failed creations
      const successfulExhibits = newExhibits.filter(
        (e): e is Exhibit => e !== null,
      );
      console.log("[App] Successful exhibits:", successfulExhibits.length);

      // Add to repository (optimistic update)
      setRepositoryFiles((prev) => [...prev, ...successfulExhibits]);

      // Extract metadata asynchronously and update status
      successfulExhibits.forEach(async (exhibit) => {
        const metadata = await extractPdfMetadata(exhibit.file_path);

        if (metadata) {
          // Update and set page count
          const updated = await updateExhibit(
            exhibit.id,
            "processed", // Update status
            undefined, // No label change
            undefined, // No sequence change
            metadata.page_count, // Set page count
            undefined, // No description change
          );

          if (updated) {
            // Update local state
            setRepositoryFiles((prev) =>
              prev.map((e) => (e.id === exhibit.id ? updated : e)),
            );
          }
        }
      });

      toast.success(`Added ${successfulExhibits.length} file(s) to repository`);
    },
    [activeCaseId, createExhibit, extractPdfMetadata, updateExhibit],
  );

  // Handle moving file from repository to index
  const handleAddToIndex = useCallback(
    async (fileId: string) => {
      const file = repositoryFiles.find((e) => e.id === fileId);
      if (!file || !activeCaseId) return;

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
      const sequenceIndex = indexEntries.filter(
        (e) => e.rowType === "document",
      ).length;
      const label = `Tab ${sequenceIndex + 1}`;

      // Promote to bundled in database
      const promoted = await promoteToFundled(
        file.id,
        label,
        sequenceIndex,
        file.description || file.file_path.split(/[\\/]/).pop(),
      );

      if (!promoted) {
        toast.error("Failed to add document to index");
        return;
      }

      // Create index entry with new format
      const newEntry: IndexEntry = {
        id: promoted.id,
        rowType: "document",
        fileId: promoted.file_path,
        description: promoted.description || "",
        date: "",
        pageStart,
        pageEnd,
        disputed: false,
      };

      setIndexEntries((prev) => [...prev, newEntry]);

      // Update the file's status in repository (mark as linked/bundled)
      setRepositoryFiles((prev) =>
        prev.map((e) =>
          e.id === fileId ? { ...e, status: "bundled" as const } : e,
        ),
      );

      toast.success(`Added "${promoted.description || "document"}" to bundle`);
    },
    [repositoryFiles, indexEntries, activeCaseId, promoteToFundled],
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
      if (!activeCaseId) return;

      // Store current state for potential undo
      previousIndexEntriesRef.current = indexEntries;

      // Reorder the array
      let reordered = reorderArray(indexEntries, fromIndex, toIndex);

      // Recalculate page ranges based on new order (handles section breaks)
      reordered = recalculatePageRanges(reordered);

      // Update state optimistically
      setIndexEntries(reordered);

      // Persist reorder to database (only document entries)
      const exhibitIds = reordered
        .filter((e) => e.rowType === "document")
        .map((e) => e.id);
      const result = await reorderExhibits(activeCaseId, exhibitIds);

      if (result.length === 0) {
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
              await reorderExhibits(activeCaseId, previousIds);
              setIndexEntries(previousIndexEntriesRef.current);
              previousIndexEntriesRef.current = [];
              toast.info("Reorder undone");
            }
          },
        },
        duration: 5000,
      });
    },
    [indexEntries, activeCaseId, reorderExhibits],
  );

  // Handle deleting a repository file
  const handleDeleteRepositoryFile = useCallback(
    async (fileId: string) => {
      const file = repositoryFiles.find((e) => e.id === fileId);
      if (!file) return;

      // If it's bundled, also remove from index entries
      if (file.status === "bundled") {
        // Remove from index entries and recalculate
        const updatedEntries = indexEntries.filter((e) => e.id !== fileId);
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);
      }

      // Delete from database
      const success = await deleteExhibit(fileId);
      if (success) {
        // Remove from repository
        setRepositoryFiles((prev) => prev.filter((e) => e.id !== fileId));
        toast.success("File deleted");
      } else {
        toast.error("Failed to delete file");
      }
    },
    [repositoryFiles, indexEntries, deleteExhibit],
  );

  // Handle removing an entry from master index (demote back to repository)
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const entry = indexEntries.find((e) => e.id === entryId);

      // For section breaks, just remove from local state (no DB update needed)
      if (entry?.rowType === "section-break") {
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        setIndexEntries(updatedEntries);
        toast.success("Section break removed");
        return;
      }

      // For documents, demote back to "processed" status (keep in repository)
      const updated = await updateExhibitStatus(entryId, "processed");
      if (updated) {
        // Remove from index entries and recalculate
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        const recalculated = recalculatePageRanges(updatedEntries);
        setIndexEntries(recalculated);

        // Update status in repository (un-grey it, mark as unlinked)
        setRepositoryFiles((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, status: "processed" as const } : e,
          ),
        );

        toast.success("Document removed from bundle");
      } else {
        toast.error("Failed to remove document from bundle");
      }
    },
    [indexEntries, updateExhibitStatus],
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

  // Handle inserting a divider
  const handleInsertDivider = useCallback(() => {
    const dividerCount = indexEntries.filter(
      (e) => e.rowType === "divider",
    ).length;
    const defaultTitle = `Divider ${dividerCount + 1}`;

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

  // Convert cases to ProjectCase format
  const projectCases: ProjectCase[] = cases.map((c) => ({
    id: c.id,
    name: c.name,
    initials: "", // Will be auto-generated by ProjectSwitcher
  }));

  // Convert repository exhibits to RepositoryFile format
  const repoFilesForPanel: RepositoryFile[] = repositoryFiles.map(
    (exhibit) => ({
      id: exhibit.id,
      name:
        exhibit.description ||
        exhibit.file_path.split(/[\\/]/).pop() ||
        "Unknown",
      filePath: exhibit.file_path,
      pageCount: exhibit.page_count ?? undefined,
      isLinked: exhibit.status === "bundled",
    }),
  );

  // Get selected file for Inspector
  const getSelectedFile = (): InspectorFile | null => {
    if (!selectedFileId) return null;

    if (selectionSource === "repository") {
      const exhibit = repositoryFiles.find((e) => e.id === selectedFileId);
      if (!exhibit) return null;
      return {
        id: exhibit.id,
        name:
          exhibit.description ||
          exhibit.file_path.split(/[\\/]/).pop() ||
          "Unknown",
        filePath: exhibit.file_path,
        pageCount: exhibit.page_count ?? undefined,
        isLinked: exhibit.status === "bundled",
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
          <RepositoryPanel
            files={repoFilesForPanel}
            expanded={repositoryExpanded}
            onToggle={setRepositoryExpanded}
            onFileSelect={handleSelectRepositoryFile}
            onFileDelete={handleDeleteRepositoryFile}
            onFileDrop={handleFileDrop}
            selectedFileId={
              selectionSource === "repository" ? selectedFileId : null
            }
          />
        }
        workbench={
          <Workbench
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
                isCompiling={isCompiling}
              />
            }
            entries={indexEntries}
            selectedEntry={getSelectedEntry()}
            totalBundlePages={getTotalPages(indexEntries)}
            onContentChange={handleTiptapContentChange}
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
      />
      <Toaster />
    </>
  );
}

export default App;
