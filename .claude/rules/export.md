# Export Strategy

## The "Scrivener" Philosophy

> "Honestly this one i dont think ppl will switch away from microsoft word"
> — Jun Hao, Litigation Associate

**Strategic Decision:** CasePilot is NOT a Word replacement. It's a **pre-Word structuring tool**.

### The Workflow

1. **Structure in CasePilot**: Draft affidavit, link exhibits, organize evidence
2. **Export to Word**: Click "Export" → Get perfectly formatted .docx
3. **Polish in Word**: Lawyer makes final cosmetic tweaks (fonts, margins)
4. **Export to PDF**: For eLitigation submission

**We solve the chaos, not the formatting.**

---

## Export Formats

### 1. Affidavit Export

**Output:** Two files

- `Affidavit_TanAhKow.docx` (narrative with exhibit references)
- `Affidavit_TanAhKow_Exhibits.pdf` (compiled exhibits with dividers)

**Process (Rust backend):**

```rust
#[tauri::command]
async fn export_affidavit(artifact_id: String) -> Result<ExportResult, String> {
    // 1. Load TipTap JSON from artifact.content_json
    // 2. Convert TipTap JSON to Word XML (docx is just zipped XML)
    // 3. Scan for ExhibitNodes → Build exhibit list
    // 4. For each exhibit:
    //    - Generate divider page (HTML → PDF via genpdf)
    //    - Append source PDF
    // 5. Stamp page numbers (lopdf)
    // 6. Merge into single PDF
    // 7. Return paths to both files
}
```

**Libraries:**

- `docx-rs`: Rust crate for generating .docx files
- `genpdf`: Lightweight HTML/text → PDF for divider pages
- `lopdf`: PDF merging and page numbering

---

### 2. Bundle Export

**Output:** One massive PDF

- `Bundle_Vol1.pdf` (pages 1-1000)
- `Bundle_Vol2.pdf` (pages 1001-2000)
- ...

**Process:**

```rust
#[tauri::command]
async fn export_bundle(artifact_id: String) -> Result<Vec<PathBuf>, String> {
    // 1. Query artifact_entries WHERE artifact_id = ?
    // 2. Sort by sequence_order (or by date if user selected "chronological")
    // 3. For each entry:
    //    - If row_type = 'file': Append PDF
    //    - If row_type = 'component': Render HTML → PDF → Append
    //    - If row_type = 'artifact': Recursively export nested artifact
    // 4. Calculate cumulative page numbers
    // 5. Generate TOC (Table of Contents) as first pages
    // 6. Stamp page numbers (ePD Para 78 compliance)
    // 7. Add PDF bookmarks (one per document)
    // 8. Split into volumes (1000 pages each)
}
```

---

## Critical Requirements (ePD 2021 Compliance)

### Para 78: The Sacred Rule

> **Index Page # == PDF Footer Page # == PDF Metadata Page #**

**Implementation:**

- When stamping page numbers, update BOTH:
  1. The visual stamp (drawn on the page)
  2. The PDF metadata (via lopdf's page tree)

```rust
// Correct implementation
for (i, page_id) in doc.get_pages().iter().enumerate() {
    let page_num = i + 1;

    // Visual stamp (top-right corner)
    stamp_page_number(&mut doc, page_id, page_num)?;

    // Metadata (so PDF viewers show correct page)
    update_page_metadata(&mut doc, page_id, page_num)?;
}
```

### Pre-Export Validation

Run validation BEFORE generating files:

- [ ] All ExhibitNodes reference existing files
- [ ] No pagination gaps
- [ ] All dates are in Singapore format (e.g., "12 October 2023")
- [ ] Font is Times New Roman 12pt (for affidavits)

**UI Pattern:**
Show validation errors in a modal. User must fix before export proceeds.

---

## Word Export Details

### TipTap JSON → Word XML Mapping

| TipTap Node      | Word Element                     | Notes                                |
| ---------------- | -------------------------------- | ------------------------------------ |
| `paragraph`      | `<w:p>`                          | Line spacing: 1.5                    |
| `heading`        | `<w:p>` with `<w:pStyle>Heading` | Font size: 14pt (vs 12pt body)       |
| `bold`           | `<w:r><w:b/>`                    | Standard inline formatting           |
| `exhibit` (node) | `<w:hyperlink>` or plain text    | Depends on user preference           |
| `ordered_list`   | `<w:numPr>`                      | Legal-style numbering (1., 2., 3...) |

**Key Decision:**
Exhibit references can be exported as:

1. **Plain text**: "Exhibit TAK-1" (safer, more portable)
2. **Internal hyperlinks**: Clickable in Word (fancier, but can break)

Default to plain text. Make hyperlinks opt-in.

---

## PDF Export Details

### Cover Page Generation

**User Edits in UI:**

- Party name
- Case number
- Document type ("Bundle of Documents" vs "Agreed Bundle")

**Stored in artifact_entries:**

```json
{
  "row_type": "component",
  "config_json": {
    "template": "cover_sg_supreme_court",
    "fields": {
      "court": "General Division of the High Court",
      "suit_no": "HC/S 123/2024",
      "plaintiff": "Tan Ah Kow",
      "defendant": "Lee Ah Seng",
      "doc_type": "Bundle of Documents"
    }
  }
}
```

**Rendering:**
Frontend sends rendered HTML to Rust → `genpdf` converts to PDF page.

---

### Table of Contents (TOC)

**Auto-Generated:** Always regenerated at export time, never stored.

**Format (ePD Compliant):**

| No  | Date      | Description               | Page |
| --- | --------- | ------------------------- | ---- |
| 1   | 14 Feb 24 | Invoice from Acme Corp    | 1-4  |
| 2   | 18 Mar 24 | Email re: Delayed Payment | 5    |
| 3   | 01 Apr 24 | Notice of Breach          | 6-12 |

**Implementation:**

```rust
fn generate_toc(entries: &[ArtifactEntry]) -> Vec<TocRow> {
    let mut page_offset = 0;
    entries.iter().map(|entry| {
        let page_count = get_page_count(&entry.file_id)?;
        let row = TocRow {
            number: entry.sequence_order,
            date: entry.metadata.date,
            description: entry.metadata.description,
            page_start: page_offset + 1,
            page_end: page_offset + page_count,
        };
        page_offset += page_count;
        row
    }).collect()
}
```

---

## User Experience

### Export Button Placement

- **Affidavit Mode**: Top-right toolbar → "Export to Word"
- **Bundle Mode**: Top-right toolbar → "Export to PDF"

### Progress Indication

For large bundles (64k pages like Jun Hao's case), show:

- "Merging PDFs... (42 of 82 volumes)"
- "Generating Table of Contents..."
- "Stamping page numbers... (Page 15,234 of 64,000)"

Use Tauri's event system to stream progress to frontend.

---

## Testing Checklist

Before shipping export:

- [ ] Export 10-page affidavit → Open in Word → Verify formatting
- [ ] Export 100-page bundle → Check Para 78 compliance (manual spot-check)
- [ ] Export bundle with nested affidavit → Verify recursive compilation works
- [ ] Export with cover page + divider → Check component rendering
- [ ] Stress test: 1000-page bundle (performance baseline)
