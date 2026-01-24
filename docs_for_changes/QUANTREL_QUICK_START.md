# Quantrel Quick Start Guide

## Your Token

```
eyJraWQiOiJmYjUxODViZC05MjAyLTQ4OTItYWY5Yy03YTY5NjM2MzYzMTIiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJkZW1vLWF1dGgiLCJzdWIiOiJ1c2VyOjQwNyIsImV4cCI6MTc2OTgxMjYwNiwiaWF0IjoxNzY5MjA3ODA2LCJlbWFpbCI6ImdkZWVwLjczMTRAZ21haWwuY29tIiwic2NvcGUiOiJST0xFX0FETUlOIn0.JWw26wlsKhJ_ZtI97R59ZZv-vXjiZge5CtVEVwWwfLKH75j1Ph-x5La8K1w8UQT84NLDHoVc-ylTvI_xT6FtfU2KKoc45QarOVTye15GAcOUZObhcbTVZtwiiymGHh40w2qVWxO55E04MQZo6U68YifnqLPTxQ8oG8QDiPBN2XjccjHv8dO-9IKQn7gVpaWydYns5KCvGIsJWfImni1tHOBDSvRGCLsOytjqYGwhVFF-Pb4U2BS14tnQwc3mfE9LSK16MAH5HqSpwNQSXvmimlYi1DN2SMQnXcnHOTvodPiIRR2FNpfnWnoj_nTnE6qiGssj4WWgfKXXZTq5hHI6ig
```

## Setup Instructions

### Option 1: Using VS Code Settings UI

1. **Open Cline Extension**
2. **Go to Settings** (gear icon)
3. **Set API Provider:**
   - Plan Mode API Provider: `quantrel`
   - Act Mode API Provider: `quantrel`
4. **Configure Quantrel:**
   - Click "Configure Quantrel Settings"
   - Set Base URL: `https://quantrelbackend-3.lemonplant-1fe15edf.westus2.azurecontainerapps.io` (or your backend URL)
   - Set Model ID: `anthropic/claude-3-5-sonnet` (or any model from `/api/agents/coding`)

5. **Set Token** (via Command Palette):
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type: `Preferences: Open User Settings (JSON)`
   - This won't work for secrets - see Option 2 instead

### Option 2: Using Extension Commands

1. **Store Token Programmatically**

Open the VS Code Developer Console (`Help > Toggle Developer Tools`), then run:

```javascript
// Get the extension context
const clineExtension = vscode.extensions.getExtension('saoudrizwan.claude-dev');
if (clineExtension && clineExtension.isActive) {
    const context = clineExtension.exports?.context;
    if (context) {
        await context.secrets.store('quantrelAccessToken', 'eyJraWQiOiJmYjUxODViZC05MjAyLTQ4OTItYWY5Yy03YTY5NjM2MzYzMTIiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJkZW1vLWF1dGgiLCJzdWIiOiJ1c2VyOjQwNyIsImV4cCI6MTc2OTgxMjYwNiwiaWF0IjoxNzY5MjA3ODA2LCJlbWFpbCI6ImdkZWVwLjczMTRAZ21haWwuY29tIiwic2NvcGUiOiJST0xFX0FETUlOIn0.JWw26wlsKhJ_ZtI97R59ZZv-vXjiZge5CtVEVwWwfLKH75j1Ph-x5La8K1w8UQT84NLDHoVc-ylTvI_xT6FtfU2KKoc45QarOVTye15GAcOUZObhcbTVZtwiiymGHh40w2qVWxO55E04MQZo6U68YifnqLPTxQ8oG8QDiPBN2XjccjHv8dO-9IKQn7gVpaWydYns5KCvGIsJWfImni1tHOBDSvRGCLsOytjqYGwhVFF-Pb4U2BS14tnQwc3mfE9LSK16MAH5HqSpwNQSXvmimlYi1DN2SMQnXcnHOTvodPiIRR2FNpfnWnoj_nTnE6qiGssj4WWgfKXXZTq5hHI6ig');
        console.log('Token stored successfully!');
    }
}
```

2. **Configure Settings in `settings.json`**

Press `Cmd+Shift+P` → `Preferences: Open User Settings (JSON)` and add:

```json
{
  "cline.planModeApiProvider": "quantrel",
  "cline.actModeApiProvider": "quantrel",
  "cline.quantrelBaseUrl": "https://quantrelbackend-3.lemonplant-1fe15edf.westus2.azurecontainerapps.io",
  "cline.planModeQuantrelModelId": "anthropic/claude-3-5-sonnet",
  "cline.actModeQuantrelModelId": "anthropic/claude-3-5-sonnet"
}
```

### Option 3: Easiest - Use Existing Quantrel Commands

Since Phase 1 is already implemented, you can use:

1. **Open Command Palette** (`Cmd+Shift+P`)
2. **Run:** `Quantrel: Login`
3. **Enter:** `gdeep.7314@gmail.com`
4. **Enter password** (the login command will store the token automatically)

OR if you already have the token, manually update StateManager:

```typescript
// This assumes your auth service is initialized
const { getQuantrelAuthService } = await import('./common');
const authService = getQuantrelAuthService();
// Token is already stored from Phase 1!
```

## Testing the Integration

### 1. Start the Extension

Press `F5` to launch the Extension Development Host

### 2. Open Cline

Click the Cline icon in the sidebar

### 3. Send Test Messages

Try these messages to test different actions:

**CHAT Action:**
```
Hello! Can you help me with some code?
```

**EXPLAIN Action:**
```
Explain how this authentication flow works
```

**DEBUG Action:**
```
Help me debug this error: Cannot read property 'user' of undefined
```

**REFACTOR Action:**
```
Refactor this code to make it more maintainable
```

### 4. Verify Response

- You should see streaming text appear in the chat
- The response comes from your Quantrel backend
- Check the Network tab in DevTools to see the SSE stream

## Troubleshooting

### Token Not Working

**Error:** `Quantrel access token is required`

**Solution:**
1. Verify token is stored: Open DevTools → Application → Storage → Secrets
2. Re-store the token using Option 2 above
3. Reload the extension window

### Backend Connection Failed

**Error:** `Quantrel API error (500): ...`

**Solution:**
1. Check backend is running: `curl https://quantrelbackend-3.lemonplant-1fe15edf.westus2.azurecontainerapps.io/api/agents/coding`
2. Verify the base URL in settings matches your backend
3. Check backend logs for errors

### Wrong Model ID

**Error:** `Model not found`

**Solution:**
1. Fetch available models: `curl https://quantrelbackend-3.lemonplant-1fe15edf.westus2.azurecontainerapps.io/api/agents/coding -H "Authorization: Bearer YOUR_TOKEN"`
2. Use a valid `modelId` from the response
3. Update settings with correct model ID

## What's Happening Behind the Scenes

1. **Message Sent:** User types message in Cline
2. **Action Inference:** Handler analyzes message content to determine action type
3. **Request Built:** Transforms to Quantrel format:
   ```json
   {
     "modelId": "anthropic/claude-3-5-sonnet",
     "action": "CHAT",
     "content": "User's message"
   }
   ```
4. **API Call:** POST to `/api/agent/complete` with SSE
5. **Stream Parsed:** Each `data: {"content": "..."}` event adds text to chat
6. **Done:** `data: {"finishReason": "stop"}` completes the response

## Next Steps

Once you confirm the basic integration works, we can enhance it with:

1. **Context Extraction:** Send file content, diagnostics, git status
2. **Model Discovery:** Fetch and cache models from backend
3. **Advanced Actions:** Explicit action selection UI
4. **Better Error Handling:** Parse and display Quantrel-specific errors

Enjoy using Quantrel with Cline! 🚀
