import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { AppLayout } from "./components/layout/AppLayout";
import {
  ProjectSwitcher,
  StagingArea,
  MasterIndex,
  BundlePreview,
  type StagedFile,
  type IndexEntry,
  type ProjectCase,
} from "./components/zones";
import {
  useInvoke,
  type Case as DbCase,
  type Document as DbDocument,
  type Exhibit,
} from "./hooks/useInvoke";
import {
  reorderArray,
  recalculatePageRanges,
  recalculateTabNumbers,
} from "./lib/pagination";
import { Toaster } from "./components/ui/sonner";

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
  } = useInvoke();

  // Case/document state
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zone B: Staging area state (database-backed)
  const [stagingExhibits, setStagingExhibits] = useState<Exhibit[]>([]);
  const [selectedStagedFileId, setSelectedStagedFileId] = useState<
    string | null
  >(null);

  // Zone C: Master index state
  const [indexEntries, setIndexEntries] = useState<IndexEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Zone D: Preview state
  const [currentPage, setCurrentPage] = useState(1);

  // Store previous index entries for undo functionality
  const previousIndexEntriesRef = useRef<IndexEntry[]>([]);

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

        // Load staging files for the first case
        const stagingFiles = await listStagingFiles(firstCaseId);
        setStagingExhibits(stagingFiles);

        // Load bundled exhibits for the first case
        const exhibits = await listExhibits(firstCaseId);
        if (exhibits.length > 0) {
          let currentPage = 1;
          const entries: IndexEntry[] = exhibits.map((exhibit) => {
            const pageCount = exhibit.page_count || 1;
            const pageStart = currentPage;
            const pageEnd = currentPage + pageCount - 1;
            currentPage = pageEnd + 1;

            return {
              id: exhibit.id,
              tabNumber: (exhibit.sequence_index ?? 0) + 1,
              description: exhibit.description || exhibit.label || "",
              status: "agreed" as const,
              pageStart,
              pageEnd,
              fileId: exhibit.file_path,
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
      setStagingExhibits([]);
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
            // Load staging files and exhibits for the new active case
            const stagingFiles = await listStagingFiles(nextCaseId);
            setStagingExhibits(stagingFiles);
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
                  tabNumber: (exhibit.sequence_index ?? 0) + 1,
                  description: exhibit.description || exhibit.label || "",
                  status: "agreed" as const,
                  pageStart,
                  pageEnd,
                  fileId: exhibit.file_path,
                };
              });
              setIndexEntries(entries);
            } else {
              setIndexEntries([]);
            }
          } else {
            setActiveCaseId(null);
            setStagingExhibits([]);
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
      setSelectedStagedFileId(null);
      setSelectedEntryId(null);
      setCurrentPage(1);

      // Load staging files from database
      const stagingFiles = await listStagingFiles(caseId);
      setStagingExhibits(stagingFiles);

      // Load bundled exhibits from database
      const exhibits = await listExhibits(caseId);
      if (exhibits.length > 0) {
        // Convert exhibits to IndexEntries with calculated page ranges
        let currentPage = 1;
        const entries: IndexEntry[] = exhibits.map((exhibit) => {
          const pageCount = exhibit.page_count || 1;
          const pageStart = currentPage;
          const pageEnd = currentPage + pageCount - 1;
          currentPage = pageEnd + 1;

          return {
            id: exhibit.id,
            tabNumber: (exhibit.sequence_index ?? 0) + 1,
            description: exhibit.description || exhibit.label || "",
            status: "agreed" as const,
            pageStart,
            pageEnd,
            fileId: exhibit.file_path,
          };
        });
        setIndexEntries(entries);
      } else {
        setIndexEntries([]);
      }
    },
    [listExhibits, listStagingFiles],
  );

  // Handle file drop in staging area
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

      // Create unprocessed exhibits in database immediately
      const newExhibits = await Promise.all(
        filePaths.map(async (path) => {
          const name = path.split(/[\\/]/).pop() || path;
          return await createExhibit(
            activeCaseId,
            path,
            "unprocessed", // Initial status
            undefined, // No label yet
            undefined, // No sequence yet
            undefined, // No page count yet
            name, // Description: filename
          );
        }),
      );

      // Filter out failed creations
      const successfulExhibits = newExhibits.filter(
        (e): e is Exhibit => e !== null,
      );

      // Add to staging area (optimistic update)
      setStagingExhibits((prev) => [...prev, ...successfulExhibits]);

      // Extract metadata asynchronously and update status
      successfulExhibits.forEach(async (exhibit) => {
        const metadata = await extractPdfMetadata(exhibit.file_path);

        if (metadata) {
          // Update status to processed and set page count
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
            setStagingExhibits((prev) =>
              prev.map((e) => (e.id === exhibit.id ? updated : e)),
            );
          }
        }
      });

      toast.success(`Added ${successfulExhibits.length} file(s) to staging`);
    },
    [activeCaseId, createExhibit, extractPdfMetadata, updateExhibit],
  );

  // Handle moving file from staging to index
  const handleAddToIndex = useCallback(
    async (exhibitId: string) => {
      const exhibit = stagingExhibits.find((e) => e.id === exhibitId);
      if (!exhibit || !activeCaseId) return;

      // Calculate page numbers and sequence
      const lastEntry = indexEntries[indexEntries.length - 1];
      const pageStart = lastEntry ? lastEntry.pageEnd + 1 : 1;
      const pageCount = exhibit.page_count || 1;
      const pageEnd = pageStart + pageCount - 1;
      const sequenceIndex = indexEntries.length;
      const label = `Tab ${sequenceIndex + 1}`;

      // Promote to bundled in database
      const promoted = await promoteToFundled(
        exhibit.id,
        label,
        sequenceIndex,
        exhibit.description || exhibit.file_path.split(/[\\/]/).pop(),
      );

      if (!promoted) {
        toast.error("Failed to add document to index");
        return;
      }

      // Create index entry
      const newEntry: IndexEntry = {
        id: promoted.id,
        tabNumber: sequenceIndex + 1,
        description: promoted.description || "",
        status: "agreed",
        pageStart,
        pageEnd,
        fileId: promoted.file_path,
      };

      setIndexEntries((prev) => [...prev, newEntry]);

      // Update the exhibit's status in staging area (keep it visible, just mark as bundled)
      setStagingExhibits((prev) =>
        prev.map((e) =>
          e.id === exhibitId ? { ...e, status: "bundled" as const } : e,
        ),
      );

      toast.success(`Added "${promoted.description || "document"}" to bundle`);
    },
    [stagingExhibits, indexEntries, activeCaseId, promoteToFundled],
  );

  // Handle entry selection (jump to page)
  const handleSelectEntry = useCallback(
    (entryId: string) => {
      setSelectedEntryId(entryId);
      const entry = indexEntries.find((e) => e.id === entryId);
      if (entry) {
        setCurrentPage(entry.pageStart);
      }
    },
    [indexEntries],
  );

  // Handle description change
  const handleDescriptionChange = useCallback(
    (entryId: string, description: string) => {
      setIndexEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, description } : e)),
      );
    },
    [],
  );

  // Handle status toggle
  const handleStatusToggle = useCallback((entryId: string) => {
    setIndexEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, status: e.status === "agreed" ? "disputed" : "agreed" }
          : e,
      ),
    );
  }, []);

  // Handle drag-to-reorder in Master Index
  const handleReorderEntries = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!activeCaseId) return;

      // Store current state for potential undo
      previousIndexEntriesRef.current = indexEntries;

      // Reorder the array
      let reordered = reorderArray(indexEntries, fromIndex, toIndex);

      // Recalculate tab numbers (1, 2, 3...)
      reordered = recalculateTabNumbers(reordered);

      // Recalculate page ranges based on new order
      reordered = recalculatePageRanges(reordered);

      // Update state optimistically
      setIndexEntries(reordered);

      // Persist reorder to database
      const exhibitIds = reordered.map((e) => e.id);
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
              const previousIds = previousIndexEntriesRef.current.map(
                (e) => e.id,
              );
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

  // Handle deleting a staging file
  const handleDeleteStagingFile = useCallback(
    async (fileId: string) => {
      const file = stagingExhibits.find((e) => e.id === fileId);
      if (!file) return;

      // If it's bundled, also remove from index entries
      if (file.status === "bundled") {
        // Remove from index entries and recalculate
        const updatedEntries = indexEntries.filter((e) => e.id !== fileId);
        const recalculated = recalculatePageRanges(
          recalculateTabNumbers(updatedEntries),
        );
        setIndexEntries(recalculated);
      }

      // Delete from database
      const success = await deleteExhibit(fileId);
      if (success) {
        // Remove from staging
        setStagingExhibits((prev) => prev.filter((e) => e.id !== fileId));
        toast.success("File deleted");
      } else {
        toast.error("Failed to delete file");
      }
    },
    [stagingExhibits, indexEntries, deleteExhibit],
  );

  // Handle removing an entry from master index (demote back to staging)
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      // Demote back to "processed" status (keep in staging area)
      const updated = await updateExhibitStatus(entryId, "processed");
      if (updated) {
        // Remove from index entries and recalculate
        const updatedEntries = indexEntries.filter((e) => e.id !== entryId);
        const recalculated = recalculatePageRanges(
          recalculateTabNumbers(updatedEntries),
        );
        setIndexEntries(recalculated);

        // Update status in staging area (un-grey it)
        setStagingExhibits((prev) =>
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

  // Handle export
  const handleExport = useCallback(() => {
    // TODO: Implement bundle compilation via Tauri command
    console.log("Export bundle", indexEntries);
  }, [indexEntries]);

  // Calculate total pages
  const totalPages =
    indexEntries.length > 0 ? indexEntries[indexEntries.length - 1].pageEnd : 0;

  // Convert cases to ProjectCase format
  const projectCases: ProjectCase[] = cases.map((c) => ({
    id: c.id,
    name: c.name,
    initials: "", // Will be auto-generated by ProjectSwitcher
  }));

  // Convert staging exhibits to StagedFile format for StagingArea component
  const stagedFiles: StagedFile[] = stagingExhibits.map((exhibit) => ({
    id: exhibit.id,
    name:
      exhibit.description ||
      exhibit.file_path.split(/[\\/]/).pop() ||
      "Unknown",
    filePath: exhibit.file_path,
    status: exhibit.status as "unprocessed" | "processed" | "bundled",
    pageCount: exhibit.page_count ?? undefined,
  }));

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
        sidebar={
          <ProjectSwitcher
            cases={projectCases}
            activeCaseId={activeCaseId}
            onSelectCase={handleSelectCase}
            onCreateCase={handleCreateCase}
            onDeleteCase={handleDeleteCase}
          />
        }
        staging={
          <StagingArea
            files={stagedFiles}
            onFileDrop={handleFileDrop}
            onFileSelect={(fileId) => {
              setSelectedStagedFileId(fileId);
              const file = stagedFiles.find((f) => f.id === fileId);
              // Only add to index if not already bundled
              if (file && file.status !== "bundled") {
                handleAddToIndex(fileId);
              }
            }}
            onFileDelete={handleDeleteStagingFile}
            selectedFileId={selectedStagedFileId}
          />
        }
        masterIndex={
          <MasterIndex
            entries={indexEntries}
            selectedEntryId={selectedEntryId}
            onSelectEntry={handleSelectEntry}
            onDescriptionChange={handleDescriptionChange}
            onStatusToggle={handleStatusToggle}
            onReorder={handleReorderEntries}
            onDeleteEntry={handleDeleteEntry}
          />
        }
        preview={
          <BundlePreview
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onExport={handleExport}
          />
        }
      />
      <Toaster />
    </>
  );
}

export default App;
