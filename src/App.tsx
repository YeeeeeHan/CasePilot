import { useState, useEffect, useCallback } from "react";
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
  const { listCases, createCase, listDocuments } = useInvoke();

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
  const handleFileDrop = useCallback((files: FileList) => {
    const newFiles: StagedFile[] = Array.from(files).map((file, index) => ({
      id: `staged-${Date.now()}-${index}`,
      name: file.name,
      status: "unprocessed" as const,
      pageCount: undefined, // Would be determined after PDF parsing
    }));
    setStagedFiles((prev) => [...prev, ...newFiles]);
  }, []);

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
  );
}

export default App;
