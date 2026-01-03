# Singapore Legal Formatting Rules

> **For comprehensive domain knowledge** (Evidence Act, document types, court procedures, official links), see the `singapore-legal-domain` skill.
>
> This file focuses on **validation checklists** used by the compiler-errors system.

## Authoritative Source: ePD 2021

The Supreme Court Practice Directions 2021 (ePD 2021) is the authoritative source for all formatting requirements.

**Link**: https://epd2021-supremecourt.judiciary.gov.sg

### Critical Sections

| Section              | Paragraphs | Content                            |
| -------------------- | ---------- | ---------------------------------- |
| Part 10 (Affidavits) | Para 78-80 | Pagination requirements, exhibits  |
| Part 11 (Trial Docs) | Para 102   | Bundle structure, TOC requirements |

### The Sacred Rule (Para 78)

> **Index Page # == PDF Footer Page # == PDF Metadata Page #**

If the Table of Contents says a document starts on Page 15, the PDF page counter MUST also show Page 15. This is the #1 cause of bundle rejection and re-work.

---

## Exhibit Naming Conventions

### Styles (user-configurable)

| Style        | Example                   | Use Case                          |
| ------------ | ------------------------- | --------------------------------- |
| Alphabetical | Exhibit A, B, C... AA, AB | Standard affidavits               |
| Tab          | Tab 1, Tab 2, Tab 3       | Bundle of Documents               |
| Initials     | JW-1, JW-2, JW-3          | Affidavits with deponent initials |

### Implementation

```typescript
function generateLabel(
  index: number,
  style: ExhibitStyle,
  initials?: string,
): string {
  switch (style) {
    case "alphabetical":
      return `Exhibit ${toAlpha(index + 1)}`; // 0 → A, 25 → Z, 26 → AA
    case "tab":
      return `Tab ${index + 1}`;
    case "initials":
      return `${initials}-${index + 1}`;
  }
}
```

## Supreme Court Practice Directions

### Document Formatting

- Font: Times New Roman, 12pt (body), 14pt (headings)
- Line spacing: 1.5
- Margins: 1 inch all sides (2.54cm)
- Page numbers: Bottom center, "Page X of Y"

### Affidavit Structure

1. Title (In the High Court of the Republic of Singapore)
2. Case number and parties
3. Deponent identification
4. Numbered paragraphs
5. Exhibits referenced as "marked and referred to as '[Label]'"
6. Signature block

## eLitigation Export

### PDF Requirements

- Bookmarked (each exhibit as bookmark)
- OCR layer for scanned documents
- File size: Under 10MB per document (compress if needed)

### Bundle Structure

```
bundle.pdf
├── Cover Page
├── Table of Contents (auto-generated)
├── Document 1 (pages 1-10)
├── Document 2 (pages 11-25)
└── ...
```

## Validation Checks (Pre-Export)

Run before generating final PDF:

### Pagination Checks (CRITICAL - ePD Para 78)

- [ ] **TOC page numbers match PDF positions** (the #1 check)
- [ ] All pages have pagination stamps (Page X of Y)
- [ ] No pagination gaps (e.g., pages jump from 44 to 46)
- [ ] Pagination stamps are in correct position (top-right corner)
- [ ] Page count in TOC matches actual page count

### Exhibit Checks

- [ ] All referenced exhibits are attached
- [ ] No orphan exhibits (attached but never referenced)
- [ ] Exhibit labels are sequential (no gaps in A, B, C...)

### Content Checks

- [ ] Date formats consistent (e.g., "12 October 2023")
- [ ] Party names spelled consistently throughout

### Format Checks (ePD Compliance)

- [ ] Font is Times New Roman, 12pt
- [ ] Line spacing is 1.5
- [ ] Margins are 1 inch (2.54cm) all sides
