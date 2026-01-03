/**
 * AffidavitEditor Component
 *
 * TipTap-based rich text editor for drafting affidavits.
 * Features:
 * - Auto-save with 2s debounce
 * - Editable initials badge in header
 * - ExhibitNode for file references
 * - Drag-drop file insertion
 * - Cursor-following preview
 */

import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ExhibitNode } from "@/components/editor/ExhibitNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Check, Pencil, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

export interface AvailableFile {
  id: string;
  name: string;
  path: string;
  pageCount?: number;
}

/** Handle exposed by AffidavitEditor via ref */
export interface AffidavitEditorHandle {
  insertExhibit: (file: AvailableFile) => void;
}

interface AffidavitEditorProps {
  /** Artifact ID */
  artifactId: string;
  /** Artifact name (e.g., "Affidavit of Tan Ah Kow") */
  name: string;
  /** Exhibit initials (e.g., "TAK") */
  initials: string;
  /** TipTap JSON content */
  content: string;
  /** Available files for insertion (reserved for slash command) */
  availableFiles?: AvailableFile[];
  /** Called when content changes (debounced) */
  onContentChange?: (artifactId: string, content: string) => void;
  /** Called when initials change */
  onInitialsChange?: (artifactId: string, initials: string) => void;
  /** Called when cursor enters an ExhibitNode */
  onExhibitFocus?: (filePath: string | null) => void;
}

export const AffidavitEditor = forwardRef<
  AffidavitEditorHandle,
  AffidavitEditorProps
>(function AffidavitEditor(
  {
    artifactId,
    name,
    initials,
    content,
    availableFiles: _availableFiles = [], // Reserved for future slash command
    onContentChange,
    onInitialsChange,
    onExhibitFocus,
  },
  ref,
) {
  const [isEditingInitials, setIsEditingInitials] = useState(false);
  const [editedInitials, setEditedInitials] = useState(initials);
  const [isDragOver, setIsDragOver] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(content);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Ref to hold insertExhibit function (to avoid circular dependency)
  const insertExhibitRef = useRef<(file: AvailableFile) => void>(() => {});

  // Parse initial content (could be JSON or HTML)
  const getInitialContent = useCallback(() => {
    if (!content) return "";
    try {
      const parsed = JSON.parse(content);
      if (parsed.content) {
        return parsed.content;
      }
      return parsed;
    } catch {
      return content;
    }
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start drafting your affidavit...",
      }),
      ExhibitNode,
    ],
    content: getInitialContent(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
      // Handle external drops via handleDOMEvents (not handleDrop which is for ProseMirror-level drops)
      handleDOMEvents: {
        dragover: (_view, event) => {
          const hasType = event.dataTransfer?.types.includes(
            "application/x-casepilot-file",
          );
          console.log(
            "[AffidavitEditor dragover] Has casepilot type:",
            hasType,
            "Types:",
            event.dataTransfer?.types,
          );
          if (hasType) {
            event.preventDefault();
            event.dataTransfer!.dropEffect = "copy";
            return true;
          }
          return false;
        },
        drop: (_view, event) => {
          console.log("[AffidavitEditor drop] Event triggered");
          console.log(
            "[AffidavitEditor drop] Available types:",
            event.dataTransfer?.types,
          );

          const data = event.dataTransfer?.getData(
            "application/x-casepilot-file",
          );
          console.log("[AffidavitEditor drop] Raw data:", data);

          if (data) {
            event.preventDefault();
            event.stopPropagation();
            try {
              const file = JSON.parse(data) as AvailableFile;
              console.log("[AffidavitEditor drop] Parsed file:", file);
              console.log("[AffidavitEditor drop] Calling insertExhibitRef");
              insertExhibitRef.current(file);
              return true;
            } catch (err) {
              console.error("[AffidavitEditor drop] Parse error:", err);
              return false;
            }
          }
          console.warn("[AffidavitEditor drop] No data found");
          return false;
        },
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        if (html !== lastSavedContentRef.current) {
          lastSavedContentRef.current = html;
          onContentChange?.(artifactId, html);
        }
      }, 2000);
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      let foundExhibit: string | null = null;

      // Check for NodeSelection (clicking directly on an exhibit)
      // NodeSelection has a 'node' property, TextSelection does not
      const selection = ed.state.selection as {
        node?: { type: { name: string }; attrs: Record<string, unknown> };
      };
      if (
        selection.node?.type.name === "exhibitNode" &&
        selection.node.attrs.filePath
      ) {
        foundExhibit = selection.node.attrs.filePath as string;
      } else {
        // Check nodes around cursor position (from-1 to to+1) to catch adjacent exhibits
        const searchFrom = Math.max(0, from - 1);
        const searchTo = Math.min(ed.state.doc.content.size, to + 1);
        ed.state.doc.nodesBetween(searchFrom, searchTo, (n) => {
          if (n.type.name === "exhibitNode" && n.attrs.filePath) {
            foundExhibit = n.attrs.filePath;
            return false;
          }
        });
      }

      onExhibitFocus?.(foundExhibit);
    },
  });

  // Update insertExhibitRef when editor is available
  useEffect(() => {
    if (!editor) return;

    insertExhibitRef.current = (file: AvailableFile) => {
      // Check for duplicate
      const existingIds: string[] = [];
      editor.state.doc.descendants((node) => {
        if (node.type.name === "exhibitNode" && node.attrs.fileId) {
          existingIds.push(node.attrs.fileId);
        }
      });

      if (existingIds.includes(file.id)) {
        toast.info(`"${file.name}" is already referenced in this document`);
        return;
      }

      editor
        .chain()
        .focus()
        .insertExhibit({
          fileId: file.id,
          fileName: file.name,
          filePath: file.path,
        })
        .insertContent(" ")
        .run();

      toast.success(`Inserted exhibit: ${file.name}`);
    };
  }, [editor]);

  // Expose insertExhibit to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      insertExhibit: (file: AvailableFile) => insertExhibitRef.current(file),
    }),
    [],
  );

  // Sync content when artifactId changes
  useEffect(() => {
    if (editor && content !== lastSavedContentRef.current) {
      const newContent = getInitialContent();
      editor.commands.setContent(newContent);
      lastSavedContentRef.current = content;
    }
  }, [artifactId, content, editor, getInitialContent]);

  // Sync initials when prop changes
  useEffect(() => {
    setEditedInitials(initials);
  }, [initials]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Handle drag events for visual feedback
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("application/x-casepilot-file")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!editorContainerRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("application/x-casepilot-file")) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    // Only handle visual state - TipTap's handleDOMEvents.drop handles insertion
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleSaveInitials = () => {
    const trimmed = editedInitials.trim().toUpperCase();
    if (trimmed && trimmed !== initials) {
      onInitialsChange?.(artifactId, trimmed);
    }
    setIsEditingInitials(false);
  };

  const handleCancelInitials = () => {
    setEditedInitials(initials);
    setIsEditingInitials(false);
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with name and initials badge */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <h2 className="text-sm font-medium truncate">{name}</h2>

        {/* Initials badge (editable) */}
        {isEditingInitials ? (
          <div className="flex items-center gap-1">
            <Input
              value={editedInitials}
              onChange={(e) =>
                setEditedInitials(e.target.value.toUpperCase().slice(0, 5))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveInitials();
                if (e.key === "Escape") handleCancelInitials();
              }}
              className="h-6 w-16 text-xs uppercase px-1"
              maxLength={5}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleSaveInitials}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleCancelInitials}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingInitials(true)}
            className={cn(
              "group flex items-center gap-1 px-2 py-0.5 rounded text-xs",
              "bg-primary/10 text-primary hover:bg-primary/20 transition-colors",
            )}
          >
            <span className="font-mono font-medium">{initials || "---"}</span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content with drag-drop zone */}
      <div
        ref={editorContainerRef}
        className={cn(
          "flex-1 overflow-auto relative",
          isDragOver && "ring-2 ring-primary ring-inset bg-primary/5",
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <EditorContent editor={editor} className="h-full" />

        {/* Drop overlay */}
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 pointer-events-none">
            <div className="bg-background rounded-lg px-4 py-2 shadow-lg border border-primary">
              <p className="text-sm font-medium text-primary">
                Drop to insert exhibit reference
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 border-t border-border text-xs text-muted-foreground bg-muted/30 flex items-center justify-between">
        <span>{editor.storage.characterCount?.words?.() ?? 0} words</span>
        <span className="text-muted-foreground/60">
          Drag files from sidebar to insert exhibits
        </span>
      </div>
    </div>
  );
});

/**
 * Get all exhibit file IDs from an affidavit's content
 */
export function getExhibitFileIdsFromContent(content: string): string[] {
  const fileIds: string[] = [];

  const regex = /data-file-id="([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!fileIds.includes(match[1])) {
      fileIds.push(match[1]);
    }
  }

  const fileIdRegex = /fileId["\s:]+["']?([a-f0-9-]+)/gi;
  while ((match = fileIdRegex.exec(content)) !== null) {
    if (!fileIds.includes(match[1])) {
      fileIds.push(match[1]);
    }
  }

  return fileIds;
}
