# Questions for Backend Team

## Critical Issue: `/api/agents/coding` Endpoint Failure

The VS Code extension is trying to fetch available models from `/api/agents/coding` but getting a 500 error.

### Error Details

```
500 - {
  "success": false,
  "error": "Handler dispatch failed: java.lang.NoSuchMethodError: 'org.springframework.data.domain.Page com.example.authtest.repository.AIModelRepository.findAgentCapableModels(org.springframework.data.domain.Pageable)'",
  "timestamp": "2026-01-24T00:06:28.032223Z",
  "code": "SERVER_ERROR"
}
```

### Questions

1. **Is `/api/agents/coding` the correct endpoint for fetching coding-capable models?**
   - The documentation (`VSCODE_EXTENSION_API_USAGE.md`) specifies this endpoint
   - Should we be using a different endpoint instead?

2. **Does the `AIModelRepository` have the `findAgentCapableModels` method implemented?**
   - The error shows this method is missing from the repository
   - What is the correct method name to fetch models that support agent actions?

3. **What is the expected response format from this endpoint?**
   - Should it return a list of `QuantrelAgent` objects as defined in `types.ts`?
   - Each model should have: `id`, `modelId`, `name`, `publisher`, `briefDescription`, `inputPrice`, `outputPrice`, `contextWindow`, `tags`, etc.

4. **Alternative endpoints - what else is available?**
   - Is there a `/api/models` endpoint that returns all models?
   - Can we filter regular models to get only agent-capable ones?
   - What query parameters are supported?

5. **Authentication requirements:**
   - Currently sending `Authorization: Bearer {accessToken}`
   - Should we also send `X-User-Id` header for this endpoint?
   - Are there any CORS settings that need to be configured?

## Expected Behavior

When the user selects "Quantrel AI" as their provider and clicks "Browse Model Marketplace", the extension should:

1. Call `GET /api/agents/coding` with the JWT token
2. Receive a JSON array of model objects
3. Display them in a searchable quick-pick UI
4. Allow the user to select a model
5. Store the selected `modelId` (e.g., "anthropic/claude-3-5-sonnet") for API requests

## Current Workaround

The extension now shows a more helpful error message:
```
Backend error: The /api/agents/coding endpoint is not fully implemented.
Please update the backend repository to implement the 'findAgentCapableModels' method.
```

## Request

Please either:
- **Option A:** Implement the `findAgentCapableModels(Pageable)` method in `AIModelRepository`
- **Option B:** Provide the correct alternative endpoint we should use
- **Option C:** Update the documentation to reflect the actual endpoint structure

Thank you!
