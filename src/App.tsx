import { useState, useEffect, useCallback } from "react";
import { Editor } from "./components/editor/Editor";
import { CaseSidebar } from "./components/sidebar/CaseSidebar";
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
  const {
    listCases,
    createCase,
    listDocuments,
    createDocument,
    loadDocument,
    saveDocument,
  } = useInvoke();

  const [cases, setCases] = useState<Case[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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
        })
      );

      setCases(casesWithDocs);
      setIsLoading(false);
    };

    loadCases();
  }, [listCases, listDocuments]);

  // Load document content when active doc changes
  useEffect(() => {
    if (!activeDocId) {
      setContent("");
      return;
    }

    const load = async () => {
      const doc = await loadDocument(activeDocId);
      if (doc) {
        setContent(doc.content);
        setIsSaved(true);
      }
    };

    load();
  }, [activeDocId, loadDocument]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!activeDocId) return;
    const saved = await saveDocument(activeDocId, content);
    if (saved) {
      setIsSaved(true);
    }
  }, [activeDocId, content, saveDocument]);

  // Save on Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleCreateCase = useCallback(async () => {
    const newCase = await createCase("New Case");
    if (newCase) {
      setCases((prev) => [
        ...prev,
        { id: newCase.id, name: newCase.name, documents: [] },
      ]);
    }
  }, [createCase]);

  const handleCreateDocument = useCallback(
    async (caseId: string) => {
      const doc = await createDocument(caseId, "New Document");
      if (doc) {
        setCases((prev) =>
          prev.map((c) => {
            if (c.id === caseId) {
              return {
                ...c,
                documents: [
                  ...c.documents,
                  { id: doc.id, name: doc.name, caseId: doc.case_id },
                ],
              };
            }
            return c;
          })
        );
        setActiveDocId(doc.id);
      }
    },
    [createDocument]
  );

  const activeDoc = cases
    .flatMap((c) => c.documents)
    .find((d) => d.id === activeDocId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      <CaseSidebar
        cases={cases}
        activeDocId={activeDocId}
        onSelectDocument={setActiveDocId}
        onCreateCase={handleCreateCase}
        onCreateDocument={handleCreateDocument}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeDoc ? (
          <>
            <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
              <h1 className="text-sm font-medium text-foreground">
                {activeDoc.name}
              </h1>
              <div className="text-xs text-muted-foreground">
                {isSaved ? "Saved" : "Unsaved"} • Press ⌘S to save
              </div>
            </header>
            <div className="flex-1 overflow-auto p-8 bg-white">
              <div className="max-w-3xl mx-auto">
                <Editor content={content} onChange={handleContentChange} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {cases.length === 0 ? (
              <div className="text-center">
                <p className="mb-2">Welcome to CasePilot</p>
                <button
                  onClick={handleCreateCase}
                  className="text-primary hover:underline"
                >
                  Create your first case
                </button>
              </div>
            ) : (
              "Select a document to start editing"
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
