---
name: user-research
description: User pain points, personas, and market positioning from litigation associate interviews. Reference when prioritizing features or explaining product decisions.
allowed-tools: Read, Grep
---

# User Research: Singapore Litigation Pain Points

## Core Insight

The pivot: CasePilot is not an AI writing assistant. It's a **Bundle Compliance Automator** that replaces Adobe Acrobat, not Microsoft Word.

---

## Pain Points (Prioritized)

### 🔥 P0: Pagination Hell

**Problem**: PDF page numbers must match Table of Contents entries exactly.

**Impact**:

- 200+ hours of manual work per case
- High risk of rejection if numbers are off by even one page
- Paralegals spend entire days in Adobe Acrobat stamping page numbers

**ePD Reference**: Supreme Court Practice Directions 2021, Part 10, Para 78

---

### 🔥 P0: Late Insert Chaos

**Problem**: Adding a document mid-bundle breaks all page numbers downstream.

**Impact**:

- Manual re-pagination of potentially 1000+ pages
- Re-exporting and re-checking the entire Table of Contents
- High-stress, last-minute scrambles before filing deadlines

**What They Need**: Automatic re-numbering OR sub-numbering (45A, 45B) with one click.

---

### 🟡 P1: Multi-Format Consolidation

**Problem**: Evidence arrives in multiple formats, all must become PDF. eLitigation only accepts PDF.

**Current Workflow**: Manual export from Outlook, screenshot tools, then manual merging.

**What They Need**: Drag folder → auto-convert → insert into bundle.

---

### 🟡 P1: Exhibit Renumbering

**Problem**: If you insert Exhibit C, all subsequent exhibits must shift (D→E, E→F, etc.).

**Impact**: Must manually update every reference in the text ("See Exhibit D" → "See Exhibit E").

**Frequency**: Happens multiple times per case during drafting.

---

### 🔵 P2: Bundle Structure Complexity

**Problem**: Each bundle needs:

- Master content page (overall index)
- Individual content pages per bundle
- PDF tabs between documents
- Bookmarks for navigation

**What They Need**: Template-based bundle generation with configurable structure. Each bundle should have its own content page, and ideally a master content page at the start.

---

## User Personas

### Primary: The Paralegal (Power User)

**Role**: Executes the 200-hour bundle assembly grind

**Demographics**:

- Non-lawyer (but legally trained)
- High volume, repetitive tasks
- Time pressure (trial deadlines)

**Tools Used**:

- Adobe Acrobat (current, hated)
- Microsoft Word (for drafting)
- Outlook (email exports)

**Pain**: Transcription pain (listening to entire audio recordings) — but deprioritized vs. pagination.

**What They Value**:

- Speed (bulk operations)
- Accuracy (zero errors)
- Undo/redo safety nets

**UX Needs**:

- Drag-and-drop file management
- Keyboard shortcuts for everything
- Progress indicators for long operations
- Clear error messages (not cryptic)

---

### Secondary: The Junior Associate (Supervisor)

**Role**: Reviews the paralegal's work, takes final responsibility

**Demographics**:

- 1-5 years PQE
- Litigation practice
- Works late nights before deadlines

**Tools Used**:

- Same as paralegal + LawNet (case research)

**Pain**: Context switching between files, manual cross-checking

**What They Value**:

- Trust (no black-box AI)
- Compliance (court will accept it)
- Speed (can handle more cases)

**UX Needs**:

- "Review mode" interface
- Quick spot-check features
- Export preview before filing

---

### Tertiary: The Partner (Decision Maker)

**Role**: Budget holder, risk-averse gatekeeper

**Concerns**:

- Professional negligence risk
- Client confidentiality
- Billable hour impact (efficiency = less revenue?)

**What They Value**:

- Risk reduction > speed
- Professional presentation
- Audit trail (who did what when)

**Sales Angle**: Pitch as "Risk Management," not "Time Saving."

---

## Market Positioning

### Target Market: Singapore Litigation

**Why Litigation?**

Litigation is a large market. Corporate law has many contract drafter AI products already available, making it difficult to compete. Litigation tools are less crowded and require specific formatting knowledge for Singapore courts.

**Competitive Landscape**:

- **Corporate Law**: Crowded (Lexis AI, contract drafters)
- **Litigation**: Less crowded, requires "anal formatting" specific to Singapore courts

**Differentiation**: Deep integration with Singapore Practice Directions (ePD 2021).

---

### Tool to Replace: Adobe Acrobat (Not Word)

**Strategic Shift**:

- Original assumption: Replace Word for drafting
- Reality: Replace Acrobat for bundle assembly

The strategic shift moves the project from a 'Writer' (Word Competitor) to a 'Builder' (Acrobat Competitor). The value isn't in generating text; it's in compiling the evidence.

**Validation**:

People normally create affidavits using Adobe Acrobat or Microsoft Word, with Acrobat being the primary tool for bundle assembly.

---

## Regulatory Context

### Supreme Court Practice Directions (ePD 2021)

**Authoritative Source**: https://epd2021-supremecourt.judiciary.gov.sg

**Key Sections**:

| Section                 | Topic         | Requirement                              |
| ----------------------- | ------------- | ---------------------------------------- |
| **Part 10, Para 78-80** | Affidavits    | PDF page numbers must match content page |
| **Part 11, Para 102**   | Trial Bundles | Bundle structure, pagination, tabs       |

All formatting requirements for documents submitted to court are specified in these sections.

**Enforcement**:

Minor non-compliance is often tolerated. If 90% of the affidavit and/or bundle of documents is legible and presentable, courts usually won't reject it.

**Implication**: The linter should have severity levels (errors vs. warnings). 90% compliance is tolerable; 100% is ideal.

---

### Court System: eLitigation

**File Format**: PDF only (no Word, no multimedia)

eLitigation only accepts PDF.

**Export Requirements**:

- Searchable text (OCR for scanned docs)
- Bookmarks for navigation
- Hyperlinked Table of Contents
- Continuous pagination (Page 1 to Page 500)

---

## Media Types (Deprioritized)

### High Priority

- **PDFs** (contracts, court orders, invoices)
- **Images** (WhatsApp screenshots, photos)
- **Emails** (exported as PDF from Outlook)

### Low Priority

- **Video (MP4)**: Rarely used
- **Audio**: Must be transcribed and notarized by a commissioner (out of scope for MVP)

---

## Research Sources

### Primary Source: Litigation Associate Interview

- **Date**: December 31, 2024
- **Role**: Practicing litigator, Singapore
- **Medium**: Telegram chat
- **File**: `telegramchat.md` (400 lines)
- **Key Topics**: Pagination, ePD 2021, paralegal workflows, market validation

### Secondary Source: LLM Strategic Analysis

- **Date**: December 2024
- **Type**: Cross-reference analysis
- **File**: `LLMchat.md` (334 lines)
- **Key Topics**: IDE metaphor validation, Bundle Compiler architecture, feature prioritization

### Pending Validation

- Additional litigator interviews needed to validate findings

---

## Strategic Implications for CasePilot

### Feature Prioritization

| Feature                  | Original Phase | New Phase     | Reason              |
| ------------------------ | -------------- | ------------- | ------------------- |
| AI Writing (Cmd+K)       | Phase 1        | Phase 3+      | Not core pain point |
| Bundle Compilation       | Phase 4        | Phase 1-2     | THE killer feature  |
| PDF Manipulation         | Phase 2        | Phase 1       | Replace Acrobat     |
| Multimedia Transcription | Phase 2        | Deprioritized | Rarely used         |

### Tech Stack Implications

**Must Invest In**:

- Rust PDF library (loam-pdf or pdf-cpu)
- TOC auto-generation
- Page number stamping without layout breaks

**Can Deprioritize**:

- Audio transcription
- Video processing
- Complex LLM features (Phase 3+)

---

## Open Questions

1. **Additional Interviews**: Schedule follow-up interviews with additional litigators to validate findings
2. **Paralegal Direct Interview**: Need to talk to actual paralegal users (current interviews are with lawyers)
3. **Bundle Size Distribution**: What's the 50th/90th/99th percentile for page count?
4. **Export Frequency**: How many times per case do they export bundles?
5. **Error Rate**: What percentage of bundles get rejected for formatting issues?

---

## Version History

| Date       | Update                                                    |
| ---------- | --------------------------------------------------------- |
| 2024-12-31 | Initial documentation from litigation associate interview |
