# Singapore Legal Formatting Rules

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

- [ ] All referenced exhibits are attached
- [ ] No orphan exhibits (attached but never referenced)
- [ ] Page references match actual pages
- [ ] Date formats consistent (e.g., "12 October 2023")
- [ ] Party names spelled consistently throughout
