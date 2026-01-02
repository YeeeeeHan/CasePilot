/**
 * AffidavitEditor Component
 *
 * TipTap-based rich text editor for drafting affidavits.
 * Features:
 * - Auto-save with 2s debounce
 * - Editable initials badge in header
 * - Placeholder text
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "@/components/editor/EditorToolbar";

interface AffidavitEditorProps {
  /** Artifact ID */
  artifactId: string;
  /** Artifact name (e.g., "Affidavit of Tan Ah Kow") */
  name: string;
  /** Exhibit initials (e.g., "TAK") */
  initials: string;
  /** TipTap JSON content */
  content: string;
  /** Called when content changes (debounced) */
  onContentChange?: (artifactId: string, content: string) => void;
  /** Called when initials change */
  onInitialsChange?: (artifactId: string, initials: string) => void;
}

export function AffidavitEditor({
  artifactId,
  name,
  initials,
  content,
  onContentChange,
  onInitialsChange,
}: AffidavitEditorProps) {
  const [isEditingInitials, setIsEditingInitials] = useState(false);
  const [editedInitials, setEditedInitials] = useState(initials);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(content);

  // Parse initial content (could be JSON or HTML)
  const getInitialContent = useCallback(() => {
    if (!content) return "";
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(content);
      // If it has a 'content' field, it's the wrapper format
      if (parsed.content) {
        return parsed.content;
      }
      return parsed;
    } catch {
      // It's HTML or plain text
      return content;
    }
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Start drafting your affidavit...",
      }),
    ],
    content: getInitialContent(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();

      // Debounce save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        if (html !== lastSavedContentRef.current) {
          lastSavedContentRef.current = html;
          onContentChange?.(artifactId, html);
        }
      }, 2000); // 2 second debounce
    },
  });

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
              "bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            )}
          >
            <span className="font-mono font-medium">
              {initials || "---"}
            </span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 border-t border-border text-xs text-muted-foreground bg-muted/30">
        {editor.storage.characterCount?.words?.() ?? 0} words
      </div>
    </div>
  );
}
