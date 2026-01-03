# Backend Rules (Rust + Tauri)

## Tauri Commands

### Location

All commands defined in `src-tauri/src/lib.rs`

### Pattern

```rust
#[tauri::command]
async fn command_name(
    param: String,
    state: tauri::State<'_, AppState>,
) -> Result<ResponseType, String> {
    // 1. Validate input
    // 2. Execute logic (may be async)
    // 3. Return Result
    Ok(response)
}
```

### Registration

Commands must be registered in the Tauri builder:

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        command_name,
        another_command,
    ])
```

## Error Handling

- Always return `Result<T, String>` from commands
- Map internal errors to user-friendly strings
- Log detailed errors server-side with `tracing`

```rust
.map_err(|e| format!("Failed to save: {}", e))?
```

## SQLite (sqlx)

### Migrations

Located in `src-tauri/migrations/`

```bash
sqlx migrate add create_exhibits_table
sqlx migrate run
```

### Queries

Use compile-time checked queries:

```rust
let exhibits = sqlx::query_as!(
    Exhibit,
    "SELECT * FROM exhibits WHERE case_id = ?",
    case_id
)
.fetch_all(&pool)
.await?;
```

## File System

### Cross-Platform Paths

```rust
use std::path::PathBuf;

// CORRECT - handles Mac/Windows automatically
let path = PathBuf::from(&user_input);
let full_path = base_dir.join(path);

// WRONG - hardcoded separator
let path = format!("{}/{}", base, file);  // Breaks on Windows
```

### Non-Blocking I/O

Long operations must not block the main thread:

```rust
// Use tokio::spawn for heavy work
tokio::spawn(async move {
    process_large_pdf(path).await
});
```

## State Management

### App State

```rust
struct AppState {
    db: SqlitePool,
    config: AppConfig,
}

// Access in commands via:
state: tauri::State<'_, AppState>
```

## Security

- Never trust frontend input - validate everything
- Sanitize file paths to prevent directory traversal
- Use prepared statements (sqlx does this automatically)
