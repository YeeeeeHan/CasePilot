import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FolderOpen,
  Plus,
} from "lucide-react";
import type { Case } from "../../App";

interface CaseSidebarProps {
  cases: Case[];
  activeDocId: string | null;
  onSelectDocument: (docId: string) => void;
  onCreateCase: () => void;
  onCreateDocument: (caseId: string) => void;
}

export function CaseSidebar({
  cases,
  activeDocId,
  onSelectDocument,
  onCreateCase,
  onCreateDocument,
}: CaseSidebarProps) {
  const [expandedCases, setExpandedCases] = useState<Set<string>>(
    new Set(cases.map((c) => c.id)),
  );

  const toggleCase = (caseId: string) => {
    setExpandedCases((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) {
        next.delete(caseId);
      } else {
        next.add(caseId);
      }
      return next;
    });
  };

  return (
    <aside className="w-64 border-r border-border bg-muted/30 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Cases
        </span>
        <button
          onClick={onCreateCase}
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="New Case"
        >
          <Plus size={14} />
        </button>
      </div>
      <nav className="flex-1 overflow-auto py-1">
        {cases.map((caseItem) => (
          <div key={caseItem.id}>
            <div
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-accent/50 cursor-pointer group"
              onClick={() => toggleCase(caseItem.id)}
            >
              {expandedCases.has(caseItem.id) ? (
                <ChevronDown size={14} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={14} className="text-muted-foreground" />
              )}
              <FolderOpen size={14} className="text-muted-foreground" />
              <span className="text-sm flex-1 truncate">{caseItem.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateDocument(caseItem.id);
                }}
                className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
                title="New Document"
              >
                <Plus size={12} />
              </button>
            </div>
            {expandedCases.has(caseItem.id) && (
              <div className="ml-4">
                {caseItem.documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded-sm mx-1 ${
                      activeDocId === doc.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-foreground"
                    }`}
                  >
                    <FileText size={14} className="text-muted-foreground" />
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                ))}
                {caseItem.documents.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                    No documents
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {cases.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            No cases yet.
            <br />
            <button
              onClick={onCreateCase}
              className="text-primary hover:underline mt-1"
            >
              Create your first case
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
