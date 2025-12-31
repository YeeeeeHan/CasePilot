---
name: ide-feature-patterns
description: Maps IDE concepts to legal equivalents. Use when designing features that need developer-familiar patterns translated for lawyers, or when naming new functionality.
allowed-tools: Read, Grep
---

# IDE-to-Legal Feature Translation

## Philosophy

CasePilot treats legal case building like coding in an IDE. This skill defines the canonical mappings between developer concepts and their legal equivalents.

## Feature Translation Table

| IDE Concept | Legal Feature | User-Facing Name | Implementation Notes |
|-------------|---------------|------------------|---------------------|
| Intellisense | Precedent Autocomplete | "Smart Suggest" | Suggest standard SG phrasing, defined terms, common legal phrases. Warn on undefined capitalized terms. |
| Refactoring | Global Argument Shift | "Rename All" | Rename terms throughout document ("The Accident" → "The Collision"), reorder claims with grammatical dependencies. |
| Debugging | Logic Linter | "Document Check" | Pre-export validation, orphan exhibit detection, broken references. |
| Go to Definition | Source-to-Cite | "View Source" | Hover preview of evidence, Cmd+Click for split-view. |
| Git Gutter | Evidence Markers | (implicit) | Right-margin paperclip icons for paragraphs containing citations. |
| Build Errors | Compiler Errors | "Problems" | VS Code-style panel showing validation issues by severity. |
| Repository | Case File | "Case Sidebar" | Structured view of facts, actors, evidence - not just files. |
| Syntax Highlighting | Role Highlighting | (implicit) | Distinct colors for party names, dates, exhibit references. |
| Code Completion | Phrase Completion | "Tab Complete" | Complete common legal phrases ("Pursuant to...", "For the avoidance of doubt..."). |
| Linting | Style Linting | "Format Check" | Singapore court formatting rules (margins, fonts, pagination). |

## Mental Model for Users

### The "Repo" Metaphor
- **Traditional**: A folder of PDFs and Word docs
- **CasePilot**: A structured database of facts, relationships, and evidence

### The "Compile" Metaphor
- **Traditional**: Export to Word, manually create exhibit list
- **CasePilot**: One-click export with auto-generated pagination, bookmarks, and certificate of exhibits

### The "Diff" Metaphor
- **Traditional**: Track Changes in Word (messy, hard to review)
- **CasePilot**: Clean diff view showing AI-proposed changes before accepting

## When to Use This Skill

- Naming a new feature → Check the translation table for consistent terminology
- Writing UI copy → Use the "User-Facing Name" column
- Designing interactions → Reference the implementation notes for expected behavior
- Onboarding content → Use the metaphors to explain concepts to lawyer users
