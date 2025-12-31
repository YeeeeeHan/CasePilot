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
  const { listCases, createCase, listDocuments, extractPdfMetadata } =
    useInvoke();

  // Case/document state
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Zone B: Staging area state
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
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

  // Load cases on mount
  useEffect(() => {
    const loadCases = async () => {
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

      // Auto-select first case if exists
      if (casesWithDocs.length > 0 && !activeCaseId) {
        setActiveCaseId(casesWithDocs[0].id);
      }

      setIsLoading(false);
    };

    loadCases();
  }, [listCases, listDocuments, activeCaseId]);

  // Handle case creation
  const handleCreateCase = useCallback(async () => {
    const newCase = await createCase("New Case");
    if (newCase) {
      setCases((prev) => [
        ...prev,
        { id: newCase.id, name: newCase.name, documents: [] },
      ]);
      setActiveCaseId(newCase.id);
    }
  }, [createCase]);

  // Handle case selection
  const handleSelectCase = useCallback((caseId: string) => {
    setActiveCaseId(caseId);
    // Reset bundle state when switching cases
    setStagedFiles([]);
    setIndexEntries([]);
    setSelectedStagedFileId(null);
    setSelectedEntryId(null);
    setCurrentPage(1);
  }, []);

  // Handle file drop in staging area
  const handleFileDrop = useCallback(
    async (filePaths: string[]) => {
      console.log(
        "[App] handleFileDrop called with",
        filePaths.length,
        "files:",
        filePaths,
      );

      // Create unprocessed files immediately (instant feedback)
      const placeholderFiles: StagedFile[] = filePaths.map((path, index) => ({
        id: `staged-${Date.now()}-${index}`,
        name: path.split(/[\\/]/).pop() || path,
        status: "unprocessed" as const,
        pageCount: undefined,
      }));
      console.log("[App] Created placeholder files:", placeholderFiles);
      setStagedFiles((prev) => [...prev, ...placeholderFiles]);

      // Extract metadata asynchronously
      console.log(
        "[App] Starting metadata extraction for",
        placeholderFiles.length,
        "files",
      );
      const processedFiles = await Promise.all(
        placeholderFiles.map(async (file, index) => {
          console.log("[App] Extracting metadata for:", filePaths[index]);
          const metadata = await extractPdfMetadata(filePaths[index]);
          console.log("[App] Metadata result for", file.name, ":", metadata);
          return {
            ...file,
            status: metadata
              ? ("processed" as const)
              : ("unprocessed" as const),
            pageCount: metadata?.page_count,
          };
        }),
      );

      console.log("[App] All metadata extracted:", processedFiles);

      // Update with page counts
      setStagedFiles((prev) =>
        prev.map((f) => {
          const updated = processedFiles.find((pf) => pf.id === f.id);
          return updated || f;
        }),
      );

      console.log("[App] handleFileDrop complete");
    },
    [extractPdfMetadata],
  );

  // Handle moving file from staging to index
  const handleAddToIndex = useCallback(
    (fileId: string) => {
      const file = stagedFiles.find((f) => f.id === fileId);
      if (!file) return;

      // Calculate page numbers based on existing entries
      const lastEntry = indexEntries[indexEntries.length - 1];
      const pageStart = lastEntry ? lastEntry.pageEnd + 1 : 1;
      const pageCount = file.pageCount || 1;
      const pageEnd = pageStart + pageCount - 1;

      const newEntry: IndexEntry = {
        id: `entry-${Date.now()}`,
        tabNumber: indexEntries.length + 1,
        description: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        status: "agreed",
        pageStart,
        pageEnd,
        fileId: file.id,
      };

      setIndexEntries((prev) => [...prev, newEntry]);

      // Update file status to bundled
      setStagedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "bundled" } : f)),
      );
    },
    [stagedFiles, indexEntries],
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
    (fromIndex: number, toIndex: number) => {
      // Store current state for potential undo
      previousIndexEntriesRef.current = indexEntries;

      // Reorder the array
      let reordered = reorderArray(indexEntries, fromIndex, toIndex);

      // Recalculate tab numbers (1, 2, 3...)
      reordered = recalculateTabNumbers(reordered);

      // Recalculate page ranges based on new order
      reordered = recalculatePageRanges(reordered);

      // Update state
      setIndexEntries(reordered);

      // Show toast with undo option
      toast.success(`Moved to position ${toIndex + 1}`, {
        description: "All page numbers recalculated automatically.",
        action: {
          label: "Undo",
          onClick: () => {
            if (previousIndexEntriesRef.current.length > 0) {
              setIndexEntries(previousIndexEntriesRef.current);
              previousIndexEntriesRef.current = [];
              toast.info("Reorder undone");
            }
          },
        },
        duration: 5000,
      });
    },
    [indexEntries],
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
          />
        }
        staging={
          <StagingArea
            files={stagedFiles}
            onFileDrop={handleFileDrop}
            onFileSelect={(fileId) => {
              setSelectedStagedFileId(fileId);
              // Double-click could add to index (for now, single click selects)
              const file = stagedFiles.find((f) => f.id === fileId);
              if (file && file.status !== "bundled") {
                handleAddToIndex(fileId);
              }
            }}
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
