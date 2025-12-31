# Testing Rules

## Test File Location and Naming

### Frontend Tests

- **Co-located**: Test files live next to source files
- **Naming**: `{ComponentName}.test.tsx` or `{hookName}.test.ts`
- **Example**: `src/components/sidebar/CaseSidebar.test.tsx`

### Backend Tests

- **Unit tests**: Inline `#[cfg(test)]` modules in the same file
- **Integration tests**: `src-tauri/tests/` directory
- **Example**: `src-tauri/src/db.rs` contains its own test module

### E2E Tests

- **Location**: `e2e/` directory at project root
- **Naming**: `{feature}.spec.ts`
- **Example**: `e2e/bundle-compilation.spec.ts`

## When Tests Must Be Written

### Always Require Tests

1. **Tauri commands**: Every `#[tauri::command]` must have corresponding tests
2. **Database operations**: All CRUD operations in `db.rs`
3. **Business logic**: Bundle compilation, pagination calculation, exhibit renumbering
4. **Custom hooks**: All hooks in `src/hooks/`
5. **Bug fixes**: Regression test required for every bug fix

### Tests Recommended

1. **React components**: Focus on user interactions, not styling
2. **Utility functions**: Pure functions in `src/lib/`
3. **Edge cases**: Error states, empty states, boundary conditions

### Tests Optional

1. **Pure UI components**: Components with no logic (just layout/styling)
2. **Third-party library wrappers**: Trust the library's tests
3. **Type definitions**: TypeScript types don't need runtime tests

## Coverage Expectations

| Layer                   | Minimum | Target |
| ----------------------- | ------- | ------ |
| Rust backend            | 60%     | 80%    |
| React hooks             | 70%     | 90%    |
| React components        | 40%     | 60%    |
| E2E critical user paths | N/A     | 100%   |

## Test Structure

### Frontend Test Structure

```typescript
describe("ComponentName", () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Group by feature/behavior
  describe("when user does X", () => {
    it("should behave like Y", () => {
      // Arrange
      // Act
      // Assert
    });
  });

  // Error cases
  describe("error handling", () => {
    it("handles network errors gracefully", () => {});
  });
});
```

### Rust Test Structure

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // Shared setup
    async fn setup() -> TestContext { ... }

    // Group tests by function
    mod create_case {
        use super::*;

        #[tokio::test]
        async fn creates_with_valid_uuid() { ... }

        #[tokio::test]
        async fn sets_timestamps() { ... }
    }
}
```

## CI/CD Behavior

### Pull Request Checks

1. **Lint**: Must pass (ESLint, Clippy)
2. **Type Check**: Must pass (tsc, cargo check)
3. **Unit Tests**: Must pass (Vitest, cargo test)
4. **Coverage**: Must not decrease significantly

### Merge Blocking

PRs cannot merge if:

- Any test fails
- Type checking fails
- Linting fails

### Main Branch

After merge to main:

- Full E2E test suite runs
- Cross-platform builds verified

## Test Data Guidelines

### Fixtures

- **Location**: `test-fixtures/`
- **PDFs**: Real anonymized samples in `pdfs/singapore-legal/`
- **Generated**: CI-safe generated PDFs in `pdfs/generated/`

### Mock Data

- Use factory functions (`mockCase()`, `mockDocument()`) for consistent mock data
- Include realistic Singapore legal content where relevant
- Example case names: "Smith v Jones", "Acme Corp Merger"

### Sensitive Data

- NEVER use real client data
- NEVER use real NRIC numbers
- Anonymize all names, addresses, dates in fixtures

## Tauri-Specific Rules

### Mocking invoke()

Always mock at the module level in `src/test/setup.ts`:

```typescript
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
```

### Testing Commands

Test the frontend and backend separately:

- Frontend: Mock invoke, test UI behavior
- Backend: Use in-memory SQLite, test business logic

### State Management

Reset state between tests:

```rust
#[tokio::test]
async fn test_isolation() {
    let pool = SqlitePoolOptions::new()
        .connect("sqlite::memory:") // Fresh database each test
        .await?;
    // ...
}
```

## Running Tests

### Commands

```bash
# Frontend
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage

# Backend
cd src-tauri && cargo test

# All (CI simulation)
npm run test:run && cd src-tauri && cargo test
```
