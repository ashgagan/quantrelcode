# VS Code Extension API Integration Guide

This guide details how to integrate the VS Code extension with the Backend Agent APIs. It provides comprehensive examples for every supported agent action.

## 1. Authentication

All API requests require a valid JWT token.
-   **Header:** `Authorization: Bearer <token>`
-   **Header:** `X-User-Id: <userId>` (Optional but recommended if available)

## 2. Agent Completion API (Streaming)

The core endpoint for all agent tasks.

-   **Endpoint:** `POST /api/agent/complete`
-   **Content-Type:** `application/json`
-   **Accept:** `text/event-stream` (Server-Sent Events)

### Response Handling (SSE)
The API streams responses using Server-Sent Events.
-   **Event `message`**: `{"content": "chunk"}` (Append to editor/chat)
-   **Event `error`**: `{"error": "...", "message": "..."}` (Handle failure)
-   **Event `done`**: `{"finishReason": "stop"}` (Close stream)

---

## 3. Supported Agent Actions & Use Cases

The backend supports 10 distinct actions. Below are the specific JSON payloads required for each.

### 1. `EXPLAIN`
**Use Case:** User highlights code and asks "What does this do?"
**Required Context:** `files` (with selection).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "EXPLAIN",
  "content": "Explain the login logic",
  "files": [
    {
      "path": "/src/Auth.java",
      "language": "java",
      "content": "...",
      "selection": { "startLine": 10, "endLine": 20, "selectedText": "public void login()..." }
    }
  ]
}
```

### 2. `REFACTOR`
**Use Case:** User wants to improve code quality, extract methods, or modernize syntax.
**Required Context:** `files` (with selection).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "REFACTOR",
  "content": "Extract this block into a helper method",
  "files": [
    {
      "path": "/src/Service.java",
      "content": "...",
      "selection": { "startLine": 50, "endLine": 65, "selectedText": "..." }
    }
  ]
}
```

### 3. `DEBUG`
**Use Case:** User is stuck with a bug and needs help finding the logical error.
**Required Context:** `files` (relevant code).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "DEBUG",
  "content": "Why is this returning null?",
  "files": [{ "path": "/src/Handler.java", "content": "..." }]
}
```

### 4. `GENERATE_TESTS`
**Use Case:** Generate unit tests for a specific class or method.
**Required Context:** `files` (source code), `workspace` (to know testing framework).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "GENERATE_TESTS",
  "content": "Generate JUnit 5 tests covering edge cases",
  "files": [{ "path": "/src/Calculator.java", "content": "..." }],
  "workspace": { "projectType": "gradle", "dependencies": ["junit-jupiter"] }
}
```

### 5. `DOCUMENT`
**Use Case:** Add Javadoc/JSDoc to a function.
**Required Context:** `files` (with selection of the function signature).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "DOCUMENT",
  "content": "Add Javadoc for this method",
  "files": [{ "selection": { "startLine": 12, "selectedText": "public void process()" } }]
}
```

### 6. `FIX_ERROR`
**Use Case:** User sees a compiler error (red squiggly) and clicks "Fix".
**Required Context:** `diagnostics` (error details), `files` (code with error).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "FIX_ERROR",
  "content": "Fix the compilation error",
  "files": [{ "path": "/src/Main.java", "content": "..." }],
  "diagnostics": {
    "errors": [
      {
        "message": "Cannot assume type String",
        "line": 15,
        "severity": "error",
        "source": "javac"
      }
    ]
  }
}
```

### 7. `COMMIT_MESSAGE`
**Use Case:** Generate a commit message based on staged changes.
**Required Context:** `git` (diff and staged files).
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "COMMIT_MESSAGE",
  "content": "Generate a conventional commit message",
  "git": {
    "branch": "feature/ui-update",
    "stagedFiles": ["src/UI.js", "src/Styles.css"],
    "diff": "diff --git a/src/UI.js b/src/UI.js..."
  }
}
```

### 8. `COMPLETE`
**Use Case:** Inline code completion (Ghost text).
**Required Context:** `files` (cursor position).
```json
{
  "modelId": "gpt-4o-mini",
  "action": "COMPLETE",
  "files": [{ "path": "Main.java", "cursorLine": 10, "content": "..." }]
}
```

### 9. `REVIEW`
**Use Case:** Code Review of current changes.
**Required Context:** `git` (diff) or `files`.
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "REVIEW",
  "content": "Review my changes for security issues",
  "git": { "diff": "..." }
}
```

### 10. `CHAT`
**Use Case:** General conversational interface.
**Required Context:** Any relevant context.
```json
{
  "modelId": "anthropic/claude-3-5-sonnet",
  "action": "CHAT",
  "content": "How do I install dependencies?",
  "workspace": { "projectType": "npm" }
}
```

---

## 4. Context Reference

### `files` (List of Objects)
| Field | Type | Description |
| :--- | :--- | :--- |
| `path` | String | Absolute path (e.g., `/user/project/src/Main.java`) |
| `content` | String | Full or partial file content |
| `language` | String | Language ID (java, python, typescript) |
| `cursorLine` | Int | Current cursor line number |
| `selection` | Object | `{startLine, endLine, selectedText}` |

### `diagnostics` (Object)
| Field | Type | Description |
| :--- | :--- | :--- |
| `errors` | List | Error objects `{message, line, severity, source}` |
| `warnings` | List | Warning objects |

### `git` (Object)
| Field | Type | Description |
| :--- | :--- | :--- |
| `branch` | String | Current active branch name |
| `diff` | String | Output of `git diff --staged` |
| `stagedFiles` | List | List of staged file paths |

### `workspace` (Object)
| Field | Type | Description |
| :--- | :--- | :--- |
| `rootPath` | String | Root folder of the open workspace |
| `projectType` | String | Detected type (e.g., `maven`, `gradle`, `npm`) |
| `dependencies` | List | List of detected library names |

---

## 5. Model Discovery

To get the list of models supported for the `modelId` field:

**Endpoint:** `GET /api/agents/coding`
**Response:** list of models where `supportsAgent: true`.
