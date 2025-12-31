---
name: testing-patterns
description: Patterns for testing Tauri applications - frontend (Vitest + RTL), backend (cargo test), and E2E (Playwright). Includes Tauri invoke() mocking and PDF fixture management.
allowed-tools: Read, Edit, Grep, Glob, Bash
---

# Testing Patterns for CasePilot

## Overview

CasePilot uses a three-layer testing strategy:

1. **Unit Tests**: Fast, isolated tests for individual functions/components
2. **Integration Tests**: Tests for database operations and Tauri commands
3. **E2E Tests**: Full application tests for critical user journeys

## Frontend Testing (Vitest + React Testing Library)

### Test File Location

Tests are co-located with source files:

```
src/
├── hooks/
│   ├── useInvoke.ts
│   └── useInvoke.test.ts      # Co-located
├── components/
│   └── sidebar/
│       ├── CaseSidebar.tsx
│       └── CaseSidebar.test.tsx
```

### Mocking Tauri invoke()

The global mock is set up in `src/test/setup.ts`. Use it in tests like:

```typescript
import { vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { mockCase, mockDocument } from "@/test/mocks/tauri";

const mockInvoke = vi.mocked(invoke);

beforeEach(() => {
  mockInvoke.mockReset();
});

it("loads cases", async () => {
  mockInvoke.mockResolvedValueOnce([mockCase({ name: "Smith v Jones" })]);

  // ... test code
});
```

### Testing Hooks with renderHook

```typescript
import { renderHook, act } from "@testing-library/react";

it("sets loading state during fetch", async () => {
  mockInvoke.mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
  );

  const { result } = renderHook(() => useInvoke());

  let promise: Promise<unknown>;
  act(() => {
    promise = result.current.listCases();
  });

  expect(result.current.loading).toBe(true);

  await act(async () => {
    await promise;
  });

  expect(result.current.loading).toBe(false);
});
```

### Testing Components with User Events

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("calls onSelectDocument when document clicked", async () => {
  const user = userEvent.setup();
  const onSelectDocument = vi.fn();

  render(<CaseSidebar cases={mockCases} onSelectDocument={onSelectDocument} />);

  await user.click(screen.getByText("AEIC of John"));

  expect(onSelectDocument).toHaveBeenCalledWith("d1");
});
```

## Backend Testing (Rust)

### In-Memory SQLite for Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    async fn setup_test_db() -> Pool<Sqlite> {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create test database");

        // Enable foreign keys for cascade delete
        sqlx::query("PRAGMA foreign_keys = ON")
            .execute(&pool)
            .await
            .unwrap();

        run_migrations(&pool).await.expect("Failed to run migrations");
        pool
    }
}
```

### Test Organization

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Group tests by function
    mod create_case {
        use super::*;

        #[tokio::test]
        async fn generates_valid_uuid() { ... }

        #[tokio::test]
        async fn sets_timestamps() { ... }
    }

    mod delete_case {
        use super::*;

        #[tokio::test]
        async fn cascades_to_documents() { ... }
    }
}
```

## Test Fixtures

### PDF Fixtures Directory

```
test-fixtures/
├── pdfs/
│   ├── README.md               # Instructions
│   ├── singapore-legal/        # User-provided real PDFs
│   │   └── .gitkeep
│   ├── generated/              # CI-safe synthetic PDFs
│   │   └── .gitkeep
│   └── edge-cases/             # Error handling tests
│       └── .gitkeep
```

### Mock Data Factories

Use the factories in `src/test/mocks/tauri.ts`:

```typescript
import { mockCase, mockDocument } from "@/test/mocks/tauri";

// Create with defaults
const case1 = mockCase();

// Create with overrides
const case2 = mockCase({
  name: "Smith v Jones",
  id: "specific-id",
});
```

## Running Tests

### Frontend

```bash
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage report
```

### Backend

```bash
cd src-tauri
cargo test            # Run all tests
cargo test db::tests  # Run specific module
```

## CI/CD Integration

Tests run on every PR via GitHub Actions (`.github/workflows/ci.yml`):

1. **Frontend**: Type check → Unit tests → Coverage
2. **Backend**: Format → Clippy → Tests
3. **Build**: Cross-platform build verification

PRs are blocked if tests fail.

## Bundle Compilation Test Patterns (Future)

When implementing bundle tests, verify:

```typescript
it("calculates correct page offsets", async () => {
  const documents = [
    { id: "1", pageCount: 5 },
    { id: "2", pageCount: 10 },
  ];

  mockInvoke.mockResolvedValueOnce({
    success: true,
    tocEntries: [
      { label: "Tab 1", startPage: 3, endPage: 7 }, // TOC is 2 pages
      { label: "Tab 2", startPage: 8, endPage: 17 },
    ],
    totalPages: 17,
  });

  const result = await invoke("compile_bundle", { bundleId: "test" });

  expect(result.success).toBe(true);
  expect(result.tocEntries[0].startPage).toBe(3); // After 2-page TOC
});
```

## Exhibit Renumbering Test Patterns (Future)

```typescript
it("renumbers exhibits when one is inserted", () => {
  const { result } = renderHook(() => useExhibitRegistry());

  act(() => {
    result.current.addExhibit({ id: "e1" }); // Exhibit A
    result.current.addExhibit({ id: "e2" }); // Exhibit B
    result.current.insertExhibit(1, { id: "e3" }); // Insert at position 1
  });

  expect(result.current.exhibits[0].label).toBe("Exhibit A");
  expect(result.current.exhibits[1].label).toBe("Exhibit B"); // New one
  expect(result.current.exhibits[2].label).toBe("Exhibit C"); // Was B
});
```

## Common Gotchas

### 1. Async State Updates

Always wrap state changes in `act()`:

```typescript
// WRONG
await result.current.listCases();

// RIGHT
await act(async () => {
  await result.current.listCases();
});
```

### 2. Mock Reset

Always reset mocks in `beforeEach`:

```typescript
beforeEach(() => {
  mockInvoke.mockReset();
});
```

### 3. SQLite Foreign Keys

Enable foreign keys in test DB for cascade behavior:

```rust
sqlx::query("PRAGMA foreign_keys = ON")
    .execute(&pool)
    .await
    .unwrap();
```
