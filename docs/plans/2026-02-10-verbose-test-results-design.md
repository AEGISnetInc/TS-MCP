# TS-MCP Design: Verbose Test Results Option

- **Date:** 2026-02-10
- **Status:** Draft

## Overview

Add an optional `verbose` parameter to the `get_test_results` tool so users can retrieve individual test item details for all scripts — including passing ones. Currently, script-level detail is only fetched for non-passing scripts, leaving the `tests` array empty for passing scripts.

## Problem

When all scripts pass, `get_test_results` returns:

```json
{
  "scripts": [
    { "name": "Patient-client-id-json", "status": "Passed", "tests": [] }
  ]
}
```

Users cannot see which individual tests ran or their statuses without opening the Touchstone web UI.

## Design

### Tool Input Change

Add an optional `verbose` boolean to `get_test_results`:

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `executionId` | string | Yes | — | The execution ID returned from `launch_test_execution` |
| `verbose` | boolean | No | `false` | When `true`, fetches individual test item details for all scripts (including passing) |

Default `false` preserves current behavior — no breaking change.

### Behavior Change

**Current (`verbose: false`):**

```
For each script:
  if script status ≠ Passed and ≠ PassedWithWarnings:
    fetch /api/scriptExecDetail → populate tests[] and failures[]
  else:
    tests: [] (empty)
```

**Verbose (`verbose: true`):**

```
For each script:
  fetch /api/scriptExecDetail → populate tests[]
  if script has failures:
    populate failures[]
```

### Output Structure

No changes to the `SummarizedTestResults` shape. Verbose mode populates the same `tests` array that already exists for non-passing scripts:

```json
{
  "executionId": "12345",
  "status": "Passed",
  "summary": { "total": 14, "passed": 14, "failed": 0, "skipped": 0 },
  "scripts": [
    {
      "name": "Patient-client-id-json",
      "status": "Passed",
      "tests": [
        { "name": "Create Patient with client-assigned ID", "status": "Passed" },
        { "name": "Read Patient", "status": "Passed" },
        { "name": "Update Patient", "status": "Passed" },
        { "name": "Delete Patient", "status": "Passed" }
      ]
    }
  ],
  "failures": []
}
```

## Files Changed

| File | Change |
|------|--------|
| `src/server/tools.ts` | Add `verbose` to `GetTestResultsInputSchema` and `TOOL_DEFINITIONS` |
| `src/server/mcp-server.ts` | Pass `verbose` flag to control script detail fetching in `handleGetResults` |
| `src/utils/result-transformer.ts` | No changes — already handles script details when provided |
| `src/touchstone/types.ts` | No changes — output types unchanged |

### `src/server/tools.ts`

Update the Zod schema:

```typescript
export const GetTestResultsInputSchema = z.object({
  executionId: z.string().describe('The execution ID returned from launch_test_execution'),
  verbose: z.boolean().optional().default(false).describe('When true, fetches individual test details for all scripts including passing ones')
});
```

Update the tool definition:

```typescript
{
  name: 'get_test_results',
  description: 'Retrieve detailed results for a completed test execution, including passed tests and failure details.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      executionId: { type: 'string', description: 'The execution ID returned from launch_test_execution' },
      verbose: { type: 'boolean', description: 'When true, fetches individual test details for all scripts including passing ones. Note: adds ~15 seconds per script due to API rate limits.' }
    },
    required: ['executionId']
  }
}
```

### `src/server/mcp-server.ts`

Update `handleGetResults` to use the `verbose` flag:

```typescript
private async handleGetResults(args: unknown, authContext?: AuthContext) {
  const { executionId, verbose } = GetTestResultsInputSchema.parse(args);
  const apiKey = await this.authProvider.getApiKey(authContext);

  await this.rateLimiter.throttle('detail', RATE_LIMITS.DETAIL_ENDPOINT);
  const detail = await this.touchstoneClient.getExecutionDetail(apiKey, executionId);

  const scriptDetails = new Map<string, import('../touchstone/types.js').ScriptExecDetailResponse>();
  const scriptExecutions = detail.testScriptExecutions ?? [];

  for (const script of scriptExecutions) {
    const needsDetails = verbose || (script.status !== 'Passed' && script.status !== 'PassedWithWarnings');
    if (needsDetails) {
      await this.rateLimiter.throttle('scriptDetail', RATE_LIMITS.SCRIPT_DETAIL_ENDPOINT);
      const scriptDetail = await this.touchstoneClient.getScriptDetail(
        apiKey,
        executionId,
        script.testScript
      );
      scriptDetails.set(script.testScript, scriptDetail);
    }
  }

  const results = transformResults(detail, scriptDetails);
  // ... analytics and return unchanged
}
```

The key change is a single line:

```
// Before:
const needsDetails = script.status !== 'Passed' && script.status !== 'PassedWithWarnings';

// After:
const needsDetails = verbose || (script.status !== 'Passed' && script.status !== 'PassedWithWarnings');
```

## Performance Tradeoff

The Touchstone API requires a separate call per script (`/api/scriptExecDetail/<id>?testscript=<path>`) with a 15-second rate limit between calls. Verbose mode adds ~15 seconds per passing script.

| Scenario | Current | Verbose |
|----------|---------|---------|
| 2 scripts, both pass | 0 detail calls | 2 detail calls (~15s) |
| 2 scripts, 1 fails | 1 detail call | 2 detail calls (~15s) |
| 2 scripts, both fail | 2 detail calls | 2 detail calls (no change) |

The tool description includes a note about this so the AI caller can make an informed choice about when to use verbose mode. A batch endpoint on the Touchstone API side would eliminate this tradeoff (see `docs/plans/touchstone-api-upgrade-proposal.md`).

## Testing

| Test | What's Verified |
|------|-----------------|
| `get_test_results` without `verbose` | Existing behavior unchanged — no detail calls for passing scripts |
| `get_test_results` with `verbose: true` | Detail calls made for all scripts, `tests` array populated |
| `get_test_results` with `verbose: false` (explicit) | Same as default — no detail calls for passing scripts |
| Result transformer | No new tests needed — already handles both cases |
