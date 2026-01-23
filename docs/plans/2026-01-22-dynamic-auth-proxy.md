# Dynamic Auth Proxy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable seamless re-authentication when Touchstone API keys expire by using a local STDIO proxy that reads session tokens from keychain dynamically.

**Architecture:** Local MCP server (STDIO) proxies requests to cloud server (HTTP), reading session tokens from keychain on each request. This eliminates manual MCP config updates after re-authentication.

**Tech Stack:** TypeScript, MCP SDK (StdioServerTransport, StreamableHTTPClientTransport), keytar

---

## Task 1: Add TouchstoneApiKeyExpiredError

**Files:**
- Modify: `src/utils/errors.ts`
- Test: `tests/unit/errors.test.ts`

**Step 1: Write the failing test**

```typescript
// In tests/unit/errors.test.ts
describe('TouchstoneApiKeyExpiredError', () => {
  it('has correct message and code', () => {
    const error = new TouchstoneApiKeyExpiredError();
    expect(error.message).toBe('Touchstone API key expired');
    expect(error.code).toBe('TOUCHSTONE_API_KEY_EXPIRED');
  });

  it('includes action in details', () => {
    const error = new TouchstoneApiKeyExpiredError();
    expect(error.details).toEqual({ action: 'npx github:AEGISnetinc/TS-MCP login' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=errors.test.ts`
Expected: FAIL with "TouchstoneApiKeyExpiredError is not defined"

**Step 3: Write minimal implementation**

```typescript
// In src/utils/errors.ts - add after SessionExpiredError
export class TouchstoneApiKeyExpiredError extends TSMCPError {
  constructor() {
    super(
      'Touchstone API key expired',
      'TOUCHSTONE_API_KEY_EXPIRED',
      { action: 'npx github:AEGISnetinc/TS-MCP login' }
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=errors.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/errors.ts tests/unit/errors.test.ts
git commit -m "feat: add TouchstoneApiKeyExpiredError with action field"
```

---

## Task 2: Update formatErrorResponse to extract action

**Files:**
- Modify: `src/utils/errors.ts`
- Test: `tests/unit/errors.test.ts`

**Step 1: Write the failing test**

```typescript
// In tests/unit/errors.test.ts - add to formatErrorResponse describe block
it('extracts action to top level from details', () => {
  const error = new TouchstoneApiKeyExpiredError();
  const response = formatErrorResponse(error);
  expect(response).toEqual({
    error: 'Touchstone API key expired',
    code: 'TOUCHSTONE_API_KEY_EXPIRED',
    action: 'npx github:AEGISnetinc/TS-MCP login'
  });
});

it('includes both action and other details when present', () => {
  const error = new TSMCPError('Custom error', 'CUSTOM', {
    action: 'npx github:AEGISnetinc/TS-MCP login',
    extra: 'info'
  });
  const response = formatErrorResponse(error);
  expect(response).toEqual({
    error: 'Custom error',
    code: 'CUSTOM',
    action: 'npx github:AEGISnetinc/TS-MCP login',
    details: { extra: 'info' }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=errors.test.ts`
Expected: FAIL - action nested in details, not at top level

**Step 3: Write minimal implementation**

```typescript
// In src/utils/errors.ts - update ErrorResponse interface
export interface ErrorResponse {
  error: string;
  code: string;
  action?: string;
  details?: Record<string, unknown>;
}

// Update formatErrorResponse function
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof TSMCPError) {
    // Extract action from details if present
    const action = error.details?.action as string | undefined;
    const otherDetails = error.details
      ? Object.fromEntries(
          Object.entries(error.details).filter(([key]) => key !== 'action')
        )
      : undefined;
    const hasOtherDetails = otherDetails && Object.keys(otherDetails).length > 0;

    return {
      error: error.message,
      code: error.code,
      ...(action && { action }),
      ...(hasOtherDetails && { details: otherDetails })
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }

  return {
    error: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=errors.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/errors.ts tests/unit/errors.test.ts
git commit -m "feat: extract action to top level in error responses"
```

---

## Task 3: Update TouchstoneClient to use new error

**Files:**
- Modify: `src/touchstone/client.ts`
- Test: `tests/unit/touchstone-client.test.ts`

**Step 1: Update test expectation**

```typescript
// In tests/unit/touchstone-client.test.ts - update existing test
it('throws TouchstoneApiKeyExpiredError on 401', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401
  } as Response);

  await expect(client.launchExecution('expired-key', 'Test')).rejects.toThrow('Touchstone API key expired');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=touchstone-client.test.ts`
Expected: FAIL - throws "Session expired" not "Touchstone API key expired"

**Step 3: Write minimal implementation**

```typescript
// In src/touchstone/client.ts - update imports
import {
  AuthenticationFailedError,
  TouchstoneApiKeyExpiredError,
  ExecutionNotFoundError,
  NetworkError,
  TouchstoneError
} from '../utils/errors.js';

// Update handleErrorResponse
private handleErrorResponse(status: number, endpoint: string): never {
  if (status === 401) {
    if (endpoint === '/authenticate') {
      throw new AuthenticationFailedError();
    }
    throw new TouchstoneApiKeyExpiredError();
  }
  // ... rest unchanged
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=touchstone-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/touchstone/client.ts tests/unit/touchstone-client.test.ts
git commit -m "feat: use TouchstoneApiKeyExpiredError for 401 responses"
```

---

## Task 4: Create Proxy Server

**Files:**
- Create: `src/server/proxy-server.ts`

**Step 1: Create proxy server implementation**

```typescript
// src/server/proxy-server.ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import keytar from 'keytar';

const SERVICE_NAME = 'ts-mcp';
const DEFAULT_CLOUD_URL = 'https://ts-mcp.fly.dev/mcp';

async function getSessionToken(cloudUrl: string): Promise<string | null> {
  const baseUrl = cloudUrl.replace(/\/mcp\/?$/, '');
  const accountName = `session:${baseUrl}`;
  return keytar.getPassword(SERVICE_NAME, accountName);
}

function createAuthenticatedTransport(cloudUrl: string): StreamableHTTPClientTransport {
  const url = new URL(cloudUrl);

  const fetchWithAuth = async (input: string | URL, init?: RequestInit): Promise<Response> => {
    const token = await getSessionToken(cloudUrl);
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  };

  return new StreamableHTTPClientTransport(url, { fetch: fetchWithAuth });
}

export class ProxyServer {
  private stdioTransport: StdioServerTransport;
  private httpTransport: StreamableHTTPClientTransport;
  private isShuttingDown = false;

  constructor(cloudUrl: string = DEFAULT_CLOUD_URL) {
    this.stdioTransport = new StdioServerTransport();
    this.httpTransport = createAuthenticatedTransport(cloudUrl);
  }

  async run(): Promise<void> {
    this.stdioTransport.onmessage = async (message: JSONRPCMessage) => {
      if (this.isShuttingDown) return;
      try {
        await this.httpTransport.send(message);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Proxy error forwarding to cloud: ${errorMessage}`);
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          const requestId = (message as { id?: string | number }).id;
          const errorResponse = {
            jsonrpc: '2.0' as const,
            id: requestId ?? null,
            error: {
              code: -32000,
              message: 'Authentication required. Run: npx github:AEGISnetinc/TS-MCP login'
            }
          };
          await this.stdioTransport.send(errorResponse as JSONRPCMessage);
        }
      }
    };

    this.httpTransport.onmessage = async (message: JSONRPCMessage) => {
      if (this.isShuttingDown) return;
      try {
        await this.stdioTransport.send(message);
      } catch (error) {
        console.error('Proxy error forwarding to Claude Code:', error);
      }
    };

    this.stdioTransport.onerror = (error) => console.error('STDIO transport error:', error);
    this.httpTransport.onerror = (error) => console.error('HTTP transport error:', error);
    this.stdioTransport.onclose = () => { if (!this.isShuttingDown) this.shutdown().catch(console.error); };
    this.httpTransport.onclose = () => { if (!this.isShuttingDown) this.shutdown().catch(console.error); };

    await Promise.all([this.stdioTransport.start(), this.httpTransport.start()]);
  }

  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;
    await Promise.all([this.stdioTransport.close(), this.httpTransport.close()]);
  }
}

export async function runProxyServer(cloudUrl?: string): Promise<void> {
  const proxy = new ProxyServer(cloudUrl);
  process.on('SIGINT', async () => { await proxy.shutdown(); process.exit(0); });
  process.on('SIGTERM', async () => { await proxy.shutdown(); process.exit(0); });
  await proxy.run();
}
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/server/proxy-server.ts
git commit -m "feat: add proxy server for STDIO to cloud forwarding"
```

---

## Task 5: Create serve CLI command

**Files:**
- Create: `src/cli/serve.ts`
- Modify: `src/index.ts`
- Test: `tests/unit/index.test.ts`

**Step 1: Create serve CLI module**

```typescript
// src/cli/serve.ts
export interface ServeOptions {
  cloud?: boolean;
  cloudUrl?: string;
}

export async function runServeCli(options: ServeOptions): Promise<void> {
  if (options.cloud) {
    const { runProxyServer } = await import('../server/proxy-server.js');
    await runProxyServer(options.cloudUrl);
  } else {
    const { runLocalServer } = await import('../index.js');
    await runLocalServer();
  }
}
```

**Step 2: Update index.ts with serve command**

Add to handleCommand switch statement:
```typescript
case 'serve': {
  const options: { cloud?: boolean; cloudUrl?: string } = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--cloud') {
      options.cloud = true;
    } else if (args[i] === '--cloud-url' && args[i + 1]) {
      options.cloudUrl = args[++i];
    }
  }
  const { runServeCli } = await import('./cli/serve.js');
  await runServeCli(options);
  break;
}
```

**Step 3: Update help text in printHelp()**

Add to Commands section:
```typescript
console.log('  serve          Start MCP server (recommended)');
console.log('  serve --cloud  Start MCP server in cloud proxy mode');
```

Update Examples section:
```typescript
console.log('  ts-mcp serve             # Start local MCP server');
console.log('  ts-mcp serve --cloud     # Start cloud proxy (auth from keychain)');
```

**Step 4: Update tests**

```typescript
// In tests/unit/index.test.ts - update help output tests
expect(mockConsoleLog).toHaveBeenCalledWith('  serve          Start MCP server (recommended)');
expect(mockConsoleLog).toHaveBeenCalledWith('  serve --cloud  Start MCP server in cloud proxy mode');
expect(mockConsoleLog).toHaveBeenCalledWith('  ts-mcp serve             # Start local MCP server');
expect(mockConsoleLog).toHaveBeenCalledWith('  ts-mcp serve --cloud     # Start cloud proxy (auth from keychain)');
```

**Step 5: Run tests**

Run: `npm test`
Expected: PASS

**Step 6: Commit**

```bash
git add src/cli/serve.ts src/index.ts tests/unit/index.test.ts
git commit -m "feat: add serve command with --cloud proxy mode"
```

---

## Task 6: Update .gitignore for npx github support

**Files:**
- Modify: `.gitignore`

**Step 1: Remove dist/ from .gitignore**

Change:
```
node_modules/
dist/
.env
```

To:
```
node_modules/
# dist/ is committed for npx github:AEGISnetinc/TS-MCP support
.env
```

**Step 2: Commit dist/ folder**

```bash
npm run build
git add .gitignore dist/
git commit -m "chore: commit dist/ for npx github support"
```

---

## Verification

### Unit Tests
```bash
npm test
```
Expected: All 195 tests pass

### Build Verification
```bash
npm run build
ls dist/server/proxy-server.js
ls dist/cli/serve.js
```
Expected: Both files exist

### Manual Test (after pushing to GitHub)
```bash
# Login to cloud
npx github:AEGISnetinc/TS-MCP login

# Configure Claude Code
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud

# Restart Claude Code, verify MCP tools work
```

---

## Dependencies

- Repo must be moved to `github.com/AEGISnetinc/TS-MCP`
- `dist/` folder must be committed
- Cloud server must be running at `https://ts-mcp.fly.dev`
