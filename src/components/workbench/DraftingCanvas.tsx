/**
 * DraftingCanvas Component
 *
 * TipTap editor constrained to A4 dimensions for cover pages and dividers.
 * Detects page breaks and reports page count changes for pagination ripple.
 */

import { useCallback } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  FileEdit,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  divider: "Section Title",
};

/**
 * Toolbar Component
 *
 * Formatting toolbar for TipTap editor with Bold, Italic, Underline, H1, H2.
 */
interface ToolbarProps {
  editor: Editor | null;
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-muted/30">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("bold") && "bg-accent text-accent-foreground",
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("italic") && "bg-accent text-accent-foreground",
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("underline") && "bg-accent text-accent-foreground",
        )}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("heading", { level: 1 }) &&
            "bg-accent text-accent-foreground",
        )}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "h-8 w-8 p-0",
          editor.isActive("heading", { level: 2 }) &&
            "bg-accent text-accent-foreground",
        )}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

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
      Underline,
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
  const { pageCount } = usePageBreakDetection({
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
            {entryType === "cover-page" ? "Cover Page" : "Blank Page"}
          </span>
        </div>

        {/* Page count indicator */}
        <div className="text-sm text-muted-foreground">
          {pageCount} {pageCount === 1 ? "page" : "pages"}
        </div>
      </div>

      {/* TipTap Formatting Toolbar */}
      <Toolbar editor={editor} />

      {/* Editor Content - A4 pages that grow when content overflows */}
      <A4PageContainer className="flex-1 overflow-auto">
        {/* Render pages based on content */}
        {Array.from({ length: pageCount }).map((_, index) => (
          <A4Page
            key={index}
            pageNumber={index + 1}
            showPageBreak={index < pageCount - 1}
          >
            {index === 0 ? (
              <EditorContent editor={editor} className="h-full" />
            ) : (
              <div className="p-8 text-muted-foreground text-sm italic">
                Content continues on this page...
              </div>
            )}
          </A4Page>
        ))}
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
          <p className="text-sm">Select a cover page or blank page to edit</p>
        </div>
      </A4Page>
    </A4PageContainer>
  );
}
