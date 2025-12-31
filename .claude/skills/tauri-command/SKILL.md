---
name: tauri-command
description: Pattern for creating Tauri commands that bridge React frontend to Rust backend. Use when implementing new invoke() calls or designing command handlers.
allowed-tools: Read, Edit, Grep
---

# Tauri Command Pattern

## Backend (Rust)

File: `src-tauri/src/lib.rs`

```rust
#[tauri::command]
async fn command_name(
    param: ParamType,
    state: tauri::State<'_, AppState>,
) -> Result<ResponseType, String> {
    // Implementation
    Ok(response)
}
```

Register in builder:

```rust
.invoke_handler(tauri::generate_handler![command_name])
```

## Frontend (React)

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<ResponseType>("command_name", {
  param: value,
});
```

## Checklist

- [ ] Command returns `Result<T, String>`
- [ ] Async for I/O operations
- [ ] Registered in `generate_handler!`
- [ ] TypeScript types match Rust types
