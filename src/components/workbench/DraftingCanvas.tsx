/**
 * DraftingCanvas Component
 *
 * TipTap editor constrained to A4 dimensions for cover pages and dividers.
 * Detects page breaks and reports page count changes for pagination ripple.
 */

import { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { FileEdit } from "lucide-react";

import { cn } from "@/lib/utils";
import { A4Page, A4PageContainer } from "./A4Page";
import { usePageBreakDetection } from "./hooks/usePageBreakDetection";
import { A4_DIMENSIONS } from "@/types/canvas";

interface DraftingCanvasProps {
  /** Serialized TipTap content (HTML string) */
  content?: string;
  /** Entry type for placeholder text */
  entryType: "cover-page" | "divider";
  /** Callback when content changes */
  onContentChange?: (content: string, pageCount: number) => void;
  /** Additional CSS classes */
  className?: string;
}

const placeholderText = {
  "cover-page":
    "Start typing your cover page content...\n\nTip: Include case number, parties, and document title.",
  divider: "Enter section title...\n\nExample: PLAINTIFF'S DOCUMENTS",
};

export function DraftingCanvas({
  content = "",
  entryType,
  onContentChange,
  className,
}: DraftingCanvasProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: placeholderText[entryType],
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none",
          // A4 page styling
          "p-8",
          // Minimum height to fill the A4 page
          "min-h-full",
        ),
        style: `min-height: ${A4_DIMENSIONS.HEIGHT_PX - 64}px`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange?.(html, pageCount);
    },
  });

  // Detect page breaks
  const { pageCount, hasOverflow } = usePageBreakDetection({
    editor,
    onPageCountChange: useCallback(
      (newPageCount: number) => {
        if (editor) {
          onContentChange?.(editor.getHTML(), newPageCount);
        }
      },
      [editor, onContentChange],
    ),
  });

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileEdit className="h-4 w-4" />
          <span>
            {entryType === "cover-page" ? "Cover Page" : "Section Divider"}
          </span>
        </div>

        {/* Page count indicator */}
        <div className="text-sm text-muted-foreground">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
          {hasOverflow && (
            <span className="ml-2 text-amber-600">(overflow)</span>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <A4PageContainer className="flex-1">
        <A4Page showPageBreak={hasOverflow}>
          <EditorContent editor={editor} className="h-full" />
        </A4Page>

        {/* Show second page preview if overflow */}
        {hasOverflow && (
          <A4Page pageNumber={2} className="opacity-50">
            <div className="p-8 text-muted-foreground text-sm">
              Content continues...
            </div>
          </A4Page>
        )}
      </A4PageContainer>
    </div>
  );
}

/**
 * DraftingCanvasPlaceholder
 *
 * Shown when no editable content is selected.
 */
export function DraftingCanvasPlaceholder() {
  return (
    <A4PageContainer className="h-full">
      <A4Page className="flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Select a cover page or divider to edit</p>
        </div>
      </A4Page>
    </A4PageContainer>
  );
}
