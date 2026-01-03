/**
 * ExhibitNode - Custom TipTap Extension
 *
 * An inline node that represents an exhibit reference in an affidavit.
 * Stores the file_id and computes the label based on exhibit order.
 *
 * Usage:
 * - Drag a file from the Files panel to insert
 * - Type /exhibit to search and insert
 * - Renders as a styled badge: [TAK-1]
 */

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { FileText } from "lucide-react";

// The React component that renders the exhibit node
function ExhibitNodeView({ node, selected }: NodeViewProps) {
  const { fileName } = node.attrs as {
    fileName: string;
    fileId: string;
    filePath: string;
  };

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        className={`
          inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5
          rounded text-xs font-medium
          bg-primary/10 text-primary
          border border-primary/20
          cursor-default select-none
          ${selected ? "ring-2 ring-primary/50" : ""}
        `}
        contentEditable={false}
      >
        <FileText className="h-3 w-3" />
        <span className="max-w-[150px] truncate">{fileName}</span>
      </span>
    </NodeViewWrapper>
  );
}

// Type declaration for the extension
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    exhibitNode: {
      /**
       * Insert an exhibit reference
       */
      insertExhibit: (attrs: {
        fileId: string;
        fileName: string;
        filePath: string;
      }) => ReturnType;
    };
  }
}

// The TipTap extension
export const ExhibitNode = Node.create({
  name: "exhibitNode",

  group: "inline",

  inline: true,

  atom: true, // Cannot be edited, only deleted

  addAttributes() {
    return {
      fileId: {
        default: null,
      },
      fileName: {
        default: null,
      },
      filePath: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-exhibit-node]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-exhibit-node": "" }),
      HTMLAttributes.fileName || "Exhibit",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ExhibitNodeView);
  },

  addCommands() {
    return {
      insertExhibit:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});

/**
 * Helper to extract all exhibit file IDs from TipTap content
 */
export function extractExhibitFileIds(content: string): string[] {
  const fileIds: string[] = [];

  try {
    // Try parsing as JSON first
    const parsed = JSON.parse(content);
    const doc = parsed.content ? parsed : { type: "doc", content: [parsed] };

    function traverse(node: unknown) {
      if (!node || typeof node !== "object") return;

      const n = node as {
        type?: string;
        attrs?: { fileId?: string };
        content?: unknown[];
      };

      if (n.type === "exhibitNode" && n.attrs?.fileId) {
        if (!fileIds.includes(n.attrs.fileId)) {
          fileIds.push(n.attrs.fileId);
        }
      }

      if (Array.isArray(n.content)) {
        n.content.forEach(traverse);
      }
    }

    traverse(doc);
  } catch {
    // If not JSON, try regex for HTML format
    const regex = /data-file-id="([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (!fileIds.includes(match[1])) {
        fileIds.push(match[1]);
      }
    }
  }

  return fileIds;
}
