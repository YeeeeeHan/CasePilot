---
name: ai-streaming-ui
description: Pattern for streaming LLM responses with "thinking" indicators and token-by-token display. Use when implementing AI features that need ChatGPT-like streaming UX.
allowed-tools: Read, Edit, Grep, Bash
---

# AI Streaming UI Pattern

## Goal

Provide a ChatGPT-like streaming experience for local LLM inference with:

- "Thinking..." indicator while LLM processes the prompt
- Token-by-token text streaming as the model generates
- Smooth UI updates without blocking the editor
- Cancellation support for long generations

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Action (Cmd+K)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              React Component (Editor.tsx)                   │
│  1. Show "thinking" skeleton loader                         │
│  2. invoke('stream_ai_response', { prompt })                │
│  3. Set up event listener for tokens                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│             Tauri Command (ai.rs)                           │
│  1. Load model (cached after first call)                    │
│  2. Start inference in background task                      │
│  3. Emit tokens via Tauri events as they generate           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            llama.cpp (Rust Bindings)                        │
│  - Generates tokens one at a time                           │
│  - Streams via async iterator                               │
└─────────────────────────────────────────────────────────────┘
```

## Implementation

### 1. Rust Backend (src-tauri/src/ai.rs)

```rust
use llama_cpp::{LlamaModel, LlamaParams, LlamaContext};
use tauri::{AppHandle, Manager};
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize)]
struct TokenEvent {
    token: String,
    done: bool,
}

#[tauri::command]
async fn stream_ai_response(
    app: AppHandle,
    prompt: String,
) -> Result<(), String> {
    // Load model (cache this after first load)
    let model = LlamaModel::load_from_file(
        "models/llama-3-8b-q4.gguf",
        LlamaParams::default()
    ).map_err(|e| format!("Model load failed: {}", e))?;

    let ctx = model.create_context(LlamaParams::default())
        .map_err(|e| format!("Context creation failed: {}", e))?;

    // Generate tokens asynchronously
    tokio::spawn(async move {
        let mut completion = ctx.complete(&prompt).unwrap();

        while let Some(token) = completion.next() {
            // Emit each token as it's generated
            app.emit_all("ai-token", TokenEvent {
                token: token.to_string(),
                done: false,
            }).ok();
        }

        // Signal completion
        app.emit_all("ai-token", TokenEvent {
            token: "".to_string(),
            done: true,
        }).ok();
    });

    Ok(())
}
```

### 2. React Frontend (src/components/editor/AIStreaming.tsx)

```typescript
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useState, useEffect, useCallback } from "react";

interface TokenEvent {
  token: string;
  done: boolean;
}

export function useAIStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");

  const streamResponse = useCallback(async (prompt: string) => {
    setIsStreaming(true);
    setStreamedText("");

    // Set up event listener for tokens
    const unlisten = await listen<TokenEvent>("ai-token", (event) => {
      const { token, done } = event.payload;

      if (done) {
        setIsStreaming(false);
      } else {
        setStreamedText((prev) => prev + token);
      }
    });

    try {
      // Start streaming from backend
      await invoke("stream_ai_response", { prompt });
    } catch (error) {
      console.error("AI streaming failed:", error);
      setIsStreaming(false);
    }

    return unlisten; // Return cleanup function
  }, []);

  return { isStreaming, streamedText, streamResponse };
}
```

### 3. UI Component with "Thinking" Indicator

```typescript
import { useAIStreaming } from './AIStreaming';

export function AIResponseBox({ prompt }: { prompt: string }) {
  const { isStreaming, streamedText, streamResponse } = useAIStreaming();

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    (async () => {
      unlisten = await streamResponse(prompt);
    })();

    return () => {
      unlisten?.();
    };
  }, [prompt, streamResponse]);

  return (
    <div className="ai-response">
      {isStreaming && streamedText === '' && (
        <div className="thinking-indicator">
          <div className="skeleton-loader" />
          <span className="text-gray-500">Thinking...</span>
        </div>
      )}

      {streamedText && (
        <div className="streamed-content">
          {streamedText}
          {isStreaming && <span className="cursor-blink">▊</span>}
        </div>
      )}
    </div>
  );
}
```

### 4. Skeleton Loader CSS (Tailwind)

```tsx
// Thinking indicator with animated skeleton
<div className="flex items-center gap-2 p-4 bg-gray-50 rounded">
  <div className="flex gap-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
         style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
         style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
         style={{ animationDelay: '300ms' }} />
  </div>
  <span className="text-sm text-gray-500">Thinking...</span>
</div>

// Blinking cursor for streaming text
<style>
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .cursor-blink {
    animation: blink 1s infinite;
  }
</style>
```

## Performance Optimizations

### 1. Model Caching

Cache the loaded model in AppState to avoid reloading on every request:

```rust
struct AppState {
    llama_model: Arc<Mutex<Option<LlamaModel>>>,
}

#[tauri::command]
async fn stream_ai_response(
    app: AppHandle,
    state: tauri::State<'_, AppState>,
    prompt: String,
) -> Result<(), String> {
    let mut model_guard = state.llama_model.lock().await;

    if model_guard.is_none() {
        // Load model only on first call
        *model_guard = Some(load_model()?);
    }

    let model = model_guard.as_ref().unwrap();
    // ... rest of inference
}
```

### 2. Debounced UI Updates

For very fast token generation, batch tokens to avoid excessive re-renders:

```typescript
const [buffer, setBuffer] = useState<string[]>([]);

useEffect(() => {
  const interval = setInterval(() => {
    if (buffer.length > 0) {
      setStreamedText((prev) => prev + buffer.join(""));
      setBuffer([]);
    }
  }, 50); // Update UI every 50ms

  return () => clearInterval(interval);
}, [buffer]);

// In event listener:
listen<TokenEvent>("ai-token", (event) => {
  if (!event.payload.done) {
    setBuffer((prev) => [...prev, event.payload.token]);
  }
});
```

### 3. Cancellation Support

Allow users to stop long-running generations:

```rust
#[tauri::command]
async fn cancel_ai_stream(
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    state.cancel_flag.store(true, Ordering::Relaxed);
    Ok(())
}

// In generation loop:
while let Some(token) = completion.next() {
    if state.cancel_flag.load(Ordering::Relaxed) {
        break;
    }
    // ... emit token
}
```

## User Experience Patterns

### 1. State Transitions

```
[User Action] → [Thinking...] → [First Token] → [Streaming...] → [Complete]
     ↓              ↓                ↓                ↓               ↓
  Show UI      Skeleton         Hide skeleton    Show cursor     Hide cursor
                loader           Show text        blink           Final text
```

### 2. Visual Indicators

| State     | Visual                      | User Can       |
| --------- | --------------------------- | -------------- |
| Thinking  | Animated dots, skeleton     | Cancel         |
| Streaming | Text + blinking cursor      | Cancel, scroll |
| Complete  | Final text, no cursor       | Edit, copy     |
| Error     | Error message, retry button | Retry, dismiss |

### 3. Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

try {
  await invoke('stream_ai_response', { prompt });
} catch (err) {
  setError('AI generation failed. Please try again.');
  setIsStreaming(false);
}

// UI
{error && (
  <div className="error-banner">
    <span>{error}</span>
    <button onClick={() => streamResponse(prompt)}>Retry</button>
  </div>
)}
```

## Testing Strategy

### 1. Mock Streaming in Development

```rust
#[cfg(debug_assertions)]
async fn mock_stream(app: AppHandle, text: &str) {
    for token in text.chars() {
        tokio::time::sleep(Duration::from_millis(50)).await;
        app.emit_all("ai-token", TokenEvent {
            token: token.to_string(),
            done: false,
        }).ok();
    }

    app.emit_all("ai-token", TokenEvent {
        token: "".to_string(),
        done: true,
    }).ok();
}
```

### 2. Load Testing

Ensure streaming doesn't block UI for long generations:

- Test with 500+ token responses
- Verify editor remains responsive during streaming
- Check memory usage doesn't spike

### 3. Edge Cases

- Model fails to load → Show error, graceful degradation
- Network/disk slow → Show loading spinner, timeout after 30s
- User closes window mid-stream → Cancel background task
- Multiple concurrent requests → Queue or reject new requests

## Related Patterns

- **Cmd+K Architect** (`cmd-k-architect`): Where streaming UI is triggered
- **Cursor Optimization** (`cursor-optimization`): Performance patterns for AI latency
- **Tauri Command** (`tauri-command`): How to structure the Rust backend

## Dependencies

```toml
# Cargo.toml (src-tauri)
[dependencies]
llama_cpp = "0.1"  # Use edgenai/llama_cpp-rs
tokio = { version = "1", features = ["full"] }
tauri = { version = "2", features = ["devtools"] }
```

```json
// package.json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "react": "^18.0.0"
  }
}
```

## Common Pitfalls

1. **Forgetting to unlisten**: Always clean up event listeners to avoid memory leaks
2. **Blocking the main thread**: Use `tokio::spawn` for inference
3. **UI thrashing**: Batch tokens if generation is very fast (>100 tokens/sec)
4. **No error boundaries**: Wrap streaming components in error boundaries
5. **Missing loading states**: Always show "thinking" before first token arrives

## Success Metrics

- Time to first token: < 500ms
- Perceived latency: Users feel AI is "thinking" (not frozen)
- Smooth streaming: 60fps UI updates, no jank
- Cancellation: Response stops within 100ms of user clicking cancel
