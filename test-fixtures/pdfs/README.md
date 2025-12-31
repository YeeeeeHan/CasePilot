# PDF Test Fixtures

This directory contains PDF files used for testing CasePilot's bundle compilation and document handling.

## Directory Structure

```
pdfs/
├── singapore-legal/    # YOUR real anonymized PDFs go here
├── generated/          # CI-safe synthetic PDFs (auto-generated)
└── edge-cases/         # Error handling tests (corrupted, empty, etc.)
```

## Adding Your Real PDFs

For realistic testing with actual Singapore legal documents, place anonymized PDFs in `singapore-legal/`.

### Recommended Files

| Filename                 | Description                          |
| ------------------------ | ------------------------------------ |
| `affidavit-sample.pdf`   | Real Singapore affidavit format      |
| `bundle-sample.pdf`      | Real court bundle with TOC           |
| `exhibit-tabs.pdf`       | Document with tabbed exhibits        |
| `aeic-with-exhibits.pdf` | AEIC with multiple attached exhibits |

### Before Adding

1. **Anonymize all PII**:
   - Replace real names with fictitious ones
   - Remove NRIC numbers
   - Replace addresses with generic ones
   - Modify dates if needed

2. **Consider git tracking**:
   - Large PDFs (>5MB) should be added to `.gitignore`
   - Or use Git LFS for large files

## CI-Safe Testing

The `generated/` folder contains programmatically created PDFs that are safe for CI environments. These are minimal test PDFs that verify core functionality without requiring real legal documents.

To generate test PDFs (requires `pdf-lib`):

```bash
npm run generate:test-pdfs
```

## Edge Case Testing

The `edge-cases/` folder contains files for testing error handling:

| Filename        | Purpose                 |
| --------------- | ----------------------- |
| `corrupted.pdf` | Malformed PDF structure |
| `zero-byte.pdf` | Empty file              |
| `encrypted.pdf` | Password-protected PDF  |
| `not-a-pdf.pdf` | Wrong file extension    |

## Usage in Tests

### Frontend Tests

```typescript
// Tests use mocked invoke() - no actual PDFs needed
mockInvoke.mockResolvedValueOnce({
  success: true,
  totalPages: 100,
});
```

### Backend Tests

```rust
// Rust tests use in-memory SQLite - no actual PDFs needed for DB tests
// PDF manipulation tests would load from this directory:
let pdf_path = PathBuf::from("test-fixtures/pdfs/singapore-legal/affidavit-sample.pdf");
```

### E2E Tests

```typescript
// E2E tests can use real PDFs
await page.setInputFiles(
  "input[type=file]",
  "test-fixtures/pdfs/singapore-legal/bundle-sample.pdf",
);
```

## Notes

- Real PDF tests run in local development only
- CI uses synthetic PDFs from `generated/`
- Never commit client-confidential documents
