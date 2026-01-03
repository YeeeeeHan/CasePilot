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

// The React component that renders the exhibit node
// Styled to match print output: bold, underlined text (e.g., "TAK-1")
function ExhibitNodeView({ node, selected }: NodeViewProps) {
  const { fileName, exhibitLabel } = node.attrs as {
    fileName: string;
    fileId: string;
    filePath: string;
    exhibitLabel?: string;
  };

  // Display the exhibit label if available, otherwise fall back to filename
  const displayText = exhibitLabel || fileName;

  return (
    <NodeViewWrapper
      as="span"
      className="inline-block align-baseline"
      contentEditable={false}
    >
      <span
        className={`
          font-bold underline
          text-inherit
          cursor-default select-none
          mx-[2px]
          ${selected ? "bg-primary/20 rounded px-0.5" : ""}
        `}
        contentEditable={false}
        data-exhibit-node
        title={`Exhibit: ${fileName}`}
      >
        "{displayText}"
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
        exhibitLabel?: string;
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
      exhibitLabel: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-exhibit-node]",
        getAttrs: (dom: HTMLElement) => ({
          fileId: dom.getAttribute("data-file-id"),
          fileName: dom.getAttribute("data-file-name"),
          filePath: dom.getAttribute("data-file-path"),
          exhibitLabel: dom.getAttribute("data-exhibit-label"),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const displayText =
      HTMLAttributes.exhibitLabel || HTMLAttributes.fileName || "Exhibit";
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-exhibit-node": "",
        "data-file-id": HTMLAttributes.fileId,
        "data-file-name": HTMLAttributes.fileName,
        "data-file-path": HTMLAttributes.filePath,
        "data-exhibit-label": HTMLAttributes.exhibitLabel,
        style: "font-weight: bold; text-decoration: underline;",
      }),
      `"${displayText}"`,
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
 * Extract all exhibits with their details from TipTap content
 */
export interface ExhibitInfo {
  fileId: string;
  fileName: string;
  filePath: string;
  exhibitLabel?: string;
}

export function extractExhibits(content: string): ExhibitInfo[] {
  const exhibits: ExhibitInfo[] = [];

  try {
    const parsed = JSON.parse(content);
    const doc = parsed.content ? parsed : { type: "doc", content: [parsed] };

    function traverse(node: unknown) {
      if (!node || typeof node !== "object") return;

      const n = node as {
        type?: string;
        attrs?: {
          fileId?: string;
          fileName?: string;
          filePath?: string;
          exhibitLabel?: string;
        };
        content?: unknown[];
      };

      if (n.type === "exhibitNode" && n.attrs?.fileId) {
        exhibits.push({
          fileId: n.attrs.fileId,
          fileName: n.attrs.fileName || "",
          filePath: n.attrs.filePath || "",
          exhibitLabel: n.attrs.exhibitLabel,
        });
      }

      if (Array.isArray(n.content)) {
        n.content.forEach(traverse);
      }
    }

    traverse(doc);
  } catch {
    // If not JSON, try regex for HTML format
    const regex =
      /data-file-id="([^"]*)"[^>]*data-file-name="([^"]*)"[^>]*data-file-path="([^"]*)"(?:[^>]*data-exhibit-label="([^"]*)")?/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      exhibits.push({
        fileId: match[1],
        fileName: match[2],
        filePath: match[3],
        exhibitLabel: match[4],
      });
    }
  }

  return exhibits;
}

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
