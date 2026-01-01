/**
 * TemplateChooser Component
 *
 * Dialog for selecting templates when creating cover pages or dividers.
 * Provides predefined templates plus a blank option.
 */

import { useState } from "react";
import { FileText, FileCheck, File } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type TemplateType = "cover-page" | "divider";

export interface Template {
  id: string;
  name: string;
  description: string;
  content?: string; // TipTap JSON content
  icon: "file" | "file-text" | "file-check";
}

const COVER_PAGE_TEMPLATES: Template[] = [
  {
    id: "cover-blank",
    name: "Blank Cover Page",
    description: "Start with a blank A4 page",
    icon: "file",
  },
  {
    id: "cover-affidavit",
    name: "Affidavit Cover",
    description: "Standard affidavit cover with title and case details",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "AFFIDAVIT OF EVIDENCE-IN-CHIEF" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "In the matter of:" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "" }] },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "[CASE TITLE]",
              marks: [{ type: "bold" }],
            },
          ],
        },
      ],
    }),
    icon: "file-text",
  },
  {
    id: "cover-bundle",
    name: "Bundle Cover",
    description: "Cover page for a Bundle of Documents",
    content: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "BUNDLE OF DOCUMENTS" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Suit No.: [CASE NUMBER]" }],
        },
        { type: "paragraph", content: [{ type: "text", text: "" }] },
        {
          type: "paragraph",
          content: [{ type: "text", text: "[PLAINTIFF NAME]" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "v." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "[DEFENDANT NAME]" }],
        },
      ],
    }),
    icon: "file-check",
  },
];

const DIVIDER_TEMPLATES: Template[] = [
  {
    id: "divider-blank",
    name: "Blank Divider",
    description: "Start with a blank A4 page",
    icon: "file",
  },
  {
    id: "divider-tab",
    name: "Tab Divider",
    description: "Simple tab divider with centered title",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "[TAB TITLE]" }],
        },
      ],
    }),
    icon: "file-text",
  },
  {
    id: "divider-plaintiff",
    name: "Plaintiff's Documents",
    description: "Divider for Plaintiff's documents section",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "PLAINTIFF'S DOCUMENTS" }],
        },
      ],
    }),
    icon: "file-check",
  },
  {
    id: "divider-defendant",
    name: "Defendant's Documents",
    description: "Divider for Defendant's documents section",
    content: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        { type: "paragraph", content: [] },
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "DEFENDANT'S DOCUMENTS" }],
        },
      ],
    }),
    icon: "file-check",
  },
];

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  const Icon =
    template.icon === "file-text"
      ? FileText
      : template.icon === "file-check"
        ? FileCheck
        : File;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:bg-accent",
        isSelected && "border-primary bg-accent",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium text-sm">{template.name}</span>
      </div>
      <p className="text-xs text-muted-foreground">{template.description}</p>
    </button>
  );
}

interface TemplateChooserProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog is closed */
  onOpenChange: (open: boolean) => void;
  /** Type of template to show */
  type: TemplateType;
  /** Callback when a template is selected */
  onSelect: (template: Template) => void;
}

export function TemplateChooser({
  open,
  onOpenChange,
  type,
  onSelect,
}: TemplateChooserProps) {
  const templates =
    type === "cover-page" ? COVER_PAGE_TEMPLATES : DIVIDER_TEMPLATES;
  const [selectedId, setSelectedId] = useState<string | null>(
    templates[0]?.id || null,
  );

  const handleSelect = () => {
    const template = templates.find((t) => t.id === selectedId);
    if (template) {
      onSelect(template);
      onOpenChange(false);
    }
  };

  const title = type === "cover-page" ? "Choose Cover Page" : "Choose Divider";
  const description =
    type === "cover-page"
      ? "Select a template for your cover page or start with a blank page."
      : "Select a template for your divider or start with a blank page.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedId === template.id}
              onClick={() => setSelectedId(template.id)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
