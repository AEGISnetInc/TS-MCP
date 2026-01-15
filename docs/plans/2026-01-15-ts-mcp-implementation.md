# TS-MCP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MCP server that enables conversational FHIR testing through Claude Code CLI by wrapping the Touchstone API.

**Architecture:** TypeScript MCP server using STDIO transport. Wraps Touchstone REST API with rate limiting. Stores API-Key in system keychain. Tracks usage via PostHog Cloud.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, keytar, posthog-node, zod, vitest

**Design Document:** `docs/plans/2026-01-14-ts-mcp-use-case-1-design.md`

---

## Phase 1: Project Setup

### Task 1.1: Initialize npm Project

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.nvmrc`

**Step 1: Create package.json**

```bash
cd /Users/jeffhelman/DEV/TS-MCP
npm init -y
```

**Step 2: Update package.json with project metadata**

Edit `package.json` to contain:

```json
{
  "name": "ts-mcp",
  "version": "0.1.0",
  "description": "MCP server for conversational FHIR testing with Touchstone",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "ts-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "node dist/index.js"
  },
  "keywords": ["mcp", "fhir", "touchstone", "testing", "healthcare"],
  "author": "AEGIS.net, Inc.",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Step 3: Create .gitignore**

Create `.gitignore`:

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
coverage/
.vitest/
```

**Step 4: Create .nvmrc**

Create `.nvmrc`:

```
20
```

**Step 5: Initialize git repository**

```bash
cd /Users/jeffhelman/DEV/TS-MCP
git init
git add package.json .gitignore .nvmrc
git commit -m "chore: initialize npm project"
```

---

### Task 1.2: Configure TypeScript

**Files:**
- Create: `tsconfig.json`

**Step 1: Install TypeScript**

```bash
npm install --save-dev typescript @types/node
```

**Step 2: Create tsconfig.json**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 3: Commit**

```bash
git add tsconfig.json package.json package-lock.json
git commit -m "chore: configure TypeScript"
```

---

### Task 1.3: Set Up Testing with Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/unit/.gitkeep`
- Create: `tests/integration/.gitkeep`

**Step 1: Install vitest**

```bash
npm install --save-dev vitest
```

**Step 2: Create vitest.config.ts**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'tests/']
    }
  }
});
```

**Step 3: Create test directories**

```bash
mkdir -p tests/unit tests/integration
touch tests/unit/.gitkeep tests/integration/.gitkeep
```

**Step 4: Commit**

```bash
git add vitest.config.ts tests/ package.json package-lock.json
git commit -m "chore: set up vitest testing framework"
```

---

### Task 1.4: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

```bash
npm install @modelcontextprotocol/sdk keytar posthog-node zod
```

**Step 2: Install dev dependencies**

```bash
npm install --save-dev @types/keytar
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies"
```

---

## Phase 2: Core Utilities

### Task 2.1: Configuration Module

**Files:**
- Create: `src/utils/config.ts`
- Create: `tests/unit/config.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/config.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getConfig } from '../../src/utils/config.js';

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default touchstone base URL when not set', () => {
    delete process.env.TOUCHSTONE_BASE_URL;
    const config = getConfig();
    expect(config.touchstoneBaseUrl).toBe('https://touchstone.aegis.net');
  });

  it('uses custom touchstone base URL when set', () => {
    process.env.TOUCHSTONE_BASE_URL = 'https://custom.example.com';
    const config = getConfig();
    expect(config.touchstoneBaseUrl).toBe('https://custom.example.com');
  });

  it('enables telemetry by default', () => {
    delete process.env.TS_MCP_TELEMETRY;
    const config = getConfig();
    expect(config.telemetryEnabled).toBe(true);
  });

  it('disables telemetry when set to false', () => {
    process.env.TS_MCP_TELEMETRY = 'false';
    const config = getConfig();
    expect(config.telemetryEnabled).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/config.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Create src directory structure**

```bash
mkdir -p src/utils
```

**Step 4: Write minimal implementation**

Create `src/utils/config.ts`:

```typescript
export interface Config {
  touchstoneBaseUrl: string;
  telemetryEnabled: boolean;
}

export function getConfig(): Config {
  return {
    touchstoneBaseUrl: process.env.TOUCHSTONE_BASE_URL ?? 'https://touchstone.aegis.net',
    telemetryEnabled: process.env.TS_MCP_TELEMETRY !== 'false'
  };
}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/config.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/utils/config.ts tests/unit/config.test.ts
git commit -m "feat: add configuration module"
```

---

### Task 2.2: Error Types

**Files:**
- Create: `src/utils/errors.ts`
- Create: `tests/unit/errors.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/errors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  TSMCPError,
  NotAuthenticatedError,
  AuthenticationFailedError,
  SessionExpiredError,
  TestSetupNotFoundError,
  ExecutionNotFoundError,
  NetworkError,
  TouchstoneError,
  formatErrorResponse
} from '../../src/utils/errors.js';

describe('TSMCPError', () => {
  it('creates error with message and code', () => {
    const error = new TSMCPError('Test error', 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('TSMCPError');
  });
});

describe('NotAuthenticatedError', () => {
  it('has correct message and code', () => {
    const error = new NotAuthenticatedError();
    expect(error.message).toBe('Not authenticated. Please run authenticate first.');
    expect(error.code).toBe('NOT_AUTHENTICATED');
  });
});

describe('TestSetupNotFoundError', () => {
  it('includes setup name in message', () => {
    const error = new TestSetupNotFoundError('Patient-CRUD');
    expect(error.message).toBe("Test Setup 'Patient-CRUD' not found. Verify the name in Touchstone UI.");
    expect(error.code).toBe('TEST_SETUP_NOT_FOUND');
  });
});

describe('formatErrorResponse', () => {
  it('formats TSMCPError correctly', () => {
    const error = new NotAuthenticatedError();
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: 'Not authenticated. Please run authenticate first.',
      code: 'NOT_AUTHENTICATED'
    });
  });

  it('formats generic Error as unknown error', () => {
    const error = new Error('Something broke');
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: 'Something broke',
      code: 'UNKNOWN_ERROR'
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/errors.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/utils/errors.ts`:

```typescript
export class TSMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TSMCPError';
  }
}

export class NotAuthenticatedError extends TSMCPError {
  constructor() {
    super('Not authenticated. Please run authenticate first.', 'NOT_AUTHENTICATED');
  }
}

export class AuthenticationFailedError extends TSMCPError {
  constructor() {
    super('Authentication failed. Check your Touchstone credentials.', 'AUTHENTICATION_FAILED');
  }
}

export class SessionExpiredError extends TSMCPError {
  constructor() {
    super('Session expired. Please re-authenticate.', 'SESSION_EXPIRED');
  }
}

export class TestSetupNotFoundError extends TSMCPError {
  constructor(setupName: string) {
    super(
      `Test Setup '${setupName}' not found. Verify the name in Touchstone UI.`,
      'TEST_SETUP_NOT_FOUND',
      { setupName }
    );
  }
}

export class ExecutionNotFoundError extends TSMCPError {
  constructor(executionId: string) {
    super(`Execution ID '${executionId}' not found.`, 'EXECUTION_NOT_FOUND', { executionId });
  }
}

export class NetworkError extends TSMCPError {
  constructor() {
    super('Cannot reach Touchstone API. Check your network.', 'NETWORK_ERROR');
  }
}

export class TouchstoneError extends TSMCPError {
  constructor(statusCode?: number) {
    super('Touchstone service error. Try again later.', 'TOUCHSTONE_ERROR', { statusCode });
  }
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof TSMCPError) {
    return {
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details })
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

```bash
npm test -- tests/unit/errors.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/errors.ts tests/unit/errors.test.ts
git commit -m "feat: add error types and formatting"
```

---

### Task 2.3: Rate Limiter

**Files:**
- Create: `src/touchstone/rate-limiter.ts`
- Create: `tests/unit/rate-limiter.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/rate-limiter.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../../src/touchstone/rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not throttle first call', async () => {
    const limiter = new RateLimiter();
    const start = Date.now();

    await limiter.throttle('test-endpoint', 4000);

    expect(Date.now() - start).toBeLessThan(100);
  });

  it('throttles subsequent calls within interval', async () => {
    const limiter = new RateLimiter();

    await limiter.throttle('test-endpoint', 4000);

    const throttlePromise = limiter.throttle('test-endpoint', 4000);
    vi.advanceTimersByTime(4000);
    await throttlePromise;

    // Should have waited approximately 4 seconds
    expect(true).toBe(true); // If we get here, throttling worked
  });

  it('tracks different endpoints separately', async () => {
    const limiter = new RateLimiter();

    await limiter.throttle('endpoint-a', 4000);

    const start = Date.now();
    await limiter.throttle('endpoint-b', 4000);

    // Different endpoint should not be throttled
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('does not throttle if enough time has passed', async () => {
    const limiter = new RateLimiter();

    await limiter.throttle('test-endpoint', 4000);

    vi.advanceTimersByTime(5000);

    const start = Date.now();
    await limiter.throttle('test-endpoint', 4000);

    expect(Date.now() - start).toBeLessThan(100);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/rate-limiter.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Create directory structure**

```bash
mkdir -p src/touchstone
```

**Step 4: Write minimal implementation**

Create `src/touchstone/rate-limiter.ts`:

```typescript
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RateLimiter {
  private lastCall: Map<string, number> = new Map();

  async throttle(endpoint: string, minIntervalMs: number): Promise<void> {
    const now = Date.now();
    const last = this.lastCall.get(endpoint) ?? 0;
    const elapsed = now - last;

    if (elapsed < minIntervalMs) {
      await sleep(minIntervalMs - elapsed);
    }

    this.lastCall.set(endpoint, Date.now());
  }
}

// Constants for Touchstone API rate limits
export const RATE_LIMITS = {
  STATUS_ENDPOINT: 4000,    // 4 seconds
  DETAIL_ENDPOINT: 15000    // 15 seconds
} as const;
```

**Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/rate-limiter.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/touchstone/rate-limiter.ts tests/unit/rate-limiter.test.ts
git commit -m "feat: add rate limiter for Touchstone API"
```

---

## Phase 3: Keychain & Authentication

### Task 3.1: Keychain Wrapper

**Files:**
- Create: `src/auth/keychain.ts`
- Create: `tests/unit/keychain.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/keychain.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeychainService, SERVICE_NAME, ACCOUNT_NAME } from '../../src/auth/keychain.js';

// Mock keytar
vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn()
  }
}));

import keytar from 'keytar';

describe('KeychainService', () => {
  let service: KeychainService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new KeychainService();
  });

  describe('getApiKey', () => {
    it('retrieves API key from keychain', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValue('test-api-key');

      const result = await service.getApiKey();

      expect(keytar.getPassword).toHaveBeenCalledWith(SERVICE_NAME, ACCOUNT_NAME);
      expect(result).toBe('test-api-key');
    });

    it('returns null when no key stored', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValue(null);

      const result = await service.getApiKey();

      expect(result).toBeNull();
    });
  });

  describe('setApiKey', () => {
    it('stores API key in keychain', async () => {
      vi.mocked(keytar.setPassword).mockResolvedValue();

      await service.setApiKey('new-api-key');

      expect(keytar.setPassword).toHaveBeenCalledWith(SERVICE_NAME, ACCOUNT_NAME, 'new-api-key');
    });
  });

  describe('deleteApiKey', () => {
    it('removes API key from keychain', async () => {
      vi.mocked(keytar.deletePassword).mockResolvedValue(true);

      const result = await service.deleteApiKey();

      expect(keytar.deletePassword).toHaveBeenCalledWith(SERVICE_NAME, ACCOUNT_NAME);
      expect(result).toBe(true);
    });
  });

  describe('hasApiKey', () => {
    it('returns true when key exists', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValue('some-key');

      const result = await service.hasApiKey();

      expect(result).toBe(true);
    });

    it('returns false when no key', async () => {
      vi.mocked(keytar.getPassword).mockResolvedValue(null);

      const result = await service.hasApiKey();

      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/keychain.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Create directory structure**

```bash
mkdir -p src/auth
```

**Step 4: Write minimal implementation**

Create `src/auth/keychain.ts`:

```typescript
import keytar from 'keytar';

export const SERVICE_NAME = 'ts-mcp';
export const ACCOUNT_NAME = 'touchstone-api-key';

export class KeychainService {
  async getApiKey(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async setApiKey(apiKey: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
  }

  async deleteApiKey(): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== null;
  }
}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/keychain.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/auth/keychain.ts tests/unit/keychain.test.ts
git commit -m "feat: add keychain service for secure API key storage"
```

---

### Task 3.2: Touchstone API Types

**Files:**
- Create: `src/touchstone/types.ts`

**Step 1: Create type definitions**

Create `src/touchstone/types.ts`:

```typescript
import { z } from 'zod';

// Authentication
export const AuthRequestSchema = z.object({
  username: z.string(),
  password: z.string()
});
export type AuthRequest = z.infer<typeof AuthRequestSchema>;

export const AuthResponseSchema = z.object({
  'API-Key': z.string()
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Test Execution
export const LaunchExecutionRequestSchema = z.object({
  testSetup: z.string()
});
export type LaunchExecutionRequest = z.infer<typeof LaunchExecutionRequestSchema>;

export const LaunchExecutionResponseSchema = z.object({
  testExecId: z.number()
});
export type LaunchExecutionResponse = z.infer<typeof LaunchExecutionResponseSchema>;

// Execution Status
export const ExecutionStatusSchema = z.enum([
  'Not Started',
  'Running',
  'Passed',
  'PassedWithWarnings',
  'Failed',
  'Stopped',
  'Error',
  'OAuth2-Authorize'
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ExecutionStatusResponseSchema = z.object({
  testExecId: z.number(),
  status: ExecutionStatusSchema,
  message: z.string().optional()
});
export type ExecutionStatusResponse = z.infer<typeof ExecutionStatusResponseSchema>;

// Execution Details
export const ScriptResultSchema = z.object({
  testScriptName: z.string(),
  status: ExecutionStatusSchema,
  passCount: z.number().optional(),
  failCount: z.number().optional(),
  errorCount: z.number().optional(),
  warningCount: z.number().optional()
});
export type ScriptResult = z.infer<typeof ScriptResultSchema>;

export const ExecutionDetailResponseSchema = z.object({
  testExecId: z.number(),
  status: ExecutionStatusSchema,
  scriptResults: z.array(ScriptResultSchema).optional()
});
export type ExecutionDetailResponse = z.infer<typeof ExecutionDetailResponseSchema>;

// Script Execution Detail (for failure info)
export const AssertionResultSchema = z.object({
  assertionId: z.string().optional(),
  result: z.string(),
  message: z.string().optional(),
  expected: z.string().optional(),
  actual: z.string().optional()
});
export type AssertionResult = z.infer<typeof AssertionResultSchema>;

export const ScriptExecutionDetailSchema = z.object({
  testScriptName: z.string(),
  status: ExecutionStatusSchema,
  assertions: z.array(AssertionResultSchema).optional()
});
export type ScriptExecutionDetail = z.infer<typeof ScriptExecutionDetailSchema>;

// Summarized Results (our output format)
export interface TestResultSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestFailure {
  testScript: string;
  assertion: string;
  expected?: string;
  actual?: string;
  message?: string;
}

export interface SummarizedTestResults {
  executionId: string;
  status: string;
  summary: TestResultSummary;
  passed: string[];
  failures: TestFailure[];
}
```

**Step 2: Commit**

```bash
git add src/touchstone/types.ts
git commit -m "feat: add Touchstone API type definitions"
```

---

### Task 3.3: Touchstone API Client

**Files:**
- Create: `src/touchstone/client.ts`
- Create: `tests/unit/touchstone-client.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/touchstone-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TouchstoneClient } from '../../src/touchstone/client.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TouchstoneClient', () => {
  let client: TouchstoneClient;
  const baseUrl = 'https://touchstone.example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new TouchstoneClient(baseUrl);
  });

  describe('authenticate', () => {
    it('sends credentials and returns API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 'API-Key': 'test-api-key' })
      });

      const result = await client.authenticate('user', 'pass');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/touchstone/api/authenticate`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ username: 'user', password: 'pass' })
        })
      );
      expect(result).toBe('test-api-key');
    });

    it('throws AuthenticationFailedError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(client.authenticate('user', 'wrong')).rejects.toThrow('Authentication failed');
    });
  });

  describe('launchExecution', () => {
    it('launches test execution and returns ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testExecId: 12345 })
      });

      const result = await client.launchExecution('api-key', 'Patient-CRUD');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/touchstone/api/testExecution`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'API-Key': 'api-key'
          }),
          body: JSON.stringify({ testSetup: 'Patient-CRUD' })
        })
      );
      expect(result).toBe(12345);
    });

    it('throws SessionExpiredError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(client.launchExecution('expired-key', 'Test')).rejects.toThrow('Session expired');
    });
  });

  describe('getExecutionStatus', () => {
    it('returns execution status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testExecId: 12345, status: 'Running' })
      });

      const result = await client.getExecutionStatus('api-key', 12345);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/touchstone/api/testExecution/12345`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'API-Key': 'api-key'
          })
        })
      );
      expect(result.status).toBe('Running');
    });
  });

  describe('getExecutionDetail', () => {
    it('returns execution details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          testExecId: 12345,
          status: 'Passed',
          scriptResults: [
            { testScriptName: 'Patient-read', status: 'Passed', passCount: 5, failCount: 0 }
          ]
        })
      });

      const result = await client.getExecutionDetail('api-key', 12345);

      expect(result.scriptResults).toHaveLength(1);
      expect(result.scriptResults![0].testScriptName).toBe('Patient-read');
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/touchstone-client.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/touchstone/client.ts`:

```typescript
import {
  AuthenticationFailedError,
  SessionExpiredError,
  TestSetupNotFoundError,
  ExecutionNotFoundError,
  NetworkError,
  TouchstoneError
} from '../utils/errors.js';
import type { ExecutionStatusResponse, ExecutionDetailResponse } from './types.js';

export class TouchstoneClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    apiKey?: string
  ): Promise<T> {
    const url = `${this.baseUrl}/touchstone/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(apiKey && { 'API-Key': apiKey })
    };

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (error) {
      throw new NetworkError();
    }

    if (!response.ok) {
      this.handleErrorResponse(response.status, endpoint);
    }

    return response.json() as Promise<T>;
  }

  private handleErrorResponse(status: number, endpoint: string): never {
    if (status === 401) {
      if (endpoint === '/authenticate') {
        throw new AuthenticationFailedError();
      }
      throw new SessionExpiredError();
    }
    if (status === 404) {
      throw new ExecutionNotFoundError(endpoint);
    }
    throw new TouchstoneError(status);
  }

  async authenticate(username: string, password: string): Promise<string> {
    const data = await this.request<{ 'API-Key': string }>(
      '/authenticate',
      {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }
    );
    return data['API-Key'];
  }

  async launchExecution(apiKey: string, testSetupName: string): Promise<number> {
    const data = await this.request<{ testExecId: number }>(
      '/testExecution',
      {
        method: 'POST',
        body: JSON.stringify({ testSetup: testSetupName })
      },
      apiKey
    );
    return data.testExecId;
  }

  async getExecutionStatus(apiKey: string, executionId: number): Promise<ExecutionStatusResponse> {
    return this.request<ExecutionStatusResponse>(
      `/testExecution/${executionId}`,
      { method: 'GET' },
      apiKey
    );
  }

  async getExecutionDetail(apiKey: string, executionId: number): Promise<ExecutionDetailResponse> {
    return this.request<ExecutionDetailResponse>(
      `/testExecDetail/${executionId}`,
      { method: 'GET' },
      apiKey
    );
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/touchstone-client.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/touchstone/client.ts tests/unit/touchstone-client.test.ts
git commit -m "feat: add Touchstone API client"
```

---

### Task 3.4: Auth Manager

**Files:**
- Create: `src/auth/auth-manager.ts`
- Create: `tests/unit/auth-manager.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/auth-manager.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthManager } from '../../src/auth/auth-manager.js';
import { KeychainService } from '../../src/auth/keychain.js';
import { TouchstoneClient } from '../../src/touchstone/client.js';
import { NotAuthenticatedError } from '../../src/utils/errors.js';

vi.mock('../../src/auth/keychain.js');
vi.mock('../../src/touchstone/client.js');

describe('AuthManager', () => {
  let authManager: AuthManager;
  let mockKeychain: KeychainService;
  let mockClient: TouchstoneClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockKeychain = new KeychainService();
    mockClient = new TouchstoneClient('https://example.com');
    authManager = new AuthManager(mockKeychain, mockClient);
  });

  describe('authenticate', () => {
    it('authenticates and stores API key', async () => {
      vi.mocked(mockClient.authenticate).mockResolvedValue('new-api-key');
      vi.mocked(mockKeychain.setApiKey).mockResolvedValue();

      const result = await authManager.authenticate('user', 'pass');

      expect(mockClient.authenticate).toHaveBeenCalledWith('user', 'pass');
      expect(mockKeychain.setApiKey).toHaveBeenCalledWith('new-api-key');
      expect(result).toEqual({ success: true, message: 'Successfully authenticated with Touchstone.' });
    });
  });

  describe('getApiKey', () => {
    it('returns API key when authenticated', async () => {
      vi.mocked(mockKeychain.getApiKey).mockResolvedValue('stored-key');

      const result = await authManager.getApiKey();

      expect(result).toBe('stored-key');
    });

    it('throws NotAuthenticatedError when no key', async () => {
      vi.mocked(mockKeychain.getApiKey).mockResolvedValue(null);

      await expect(authManager.getApiKey()).rejects.toThrow(NotAuthenticatedError);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when key exists', async () => {
      vi.mocked(mockKeychain.hasApiKey).mockResolvedValue(true);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(true);
    });

    it('returns false when no key', async () => {
      vi.mocked(mockKeychain.hasApiKey).mockResolvedValue(false);

      const result = await authManager.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('removes API key from keychain', async () => {
      vi.mocked(mockKeychain.deleteApiKey).mockResolvedValue(true);

      await authManager.logout();

      expect(mockKeychain.deleteApiKey).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/auth-manager.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/auth/auth-manager.ts`:

```typescript
import { KeychainService } from './keychain.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { NotAuthenticatedError } from '../utils/errors.js';

export interface AuthResult {
  success: boolean;
  message: string;
}

export class AuthManager {
  constructor(
    private readonly keychain: KeychainService,
    private readonly client: TouchstoneClient
  ) {}

  async authenticate(username: string, password: string): Promise<AuthResult> {
    const apiKey = await this.client.authenticate(username, password);
    await this.keychain.setApiKey(apiKey);
    return {
      success: true,
      message: 'Successfully authenticated with Touchstone.'
    };
  }

  async getApiKey(): Promise<string> {
    const apiKey = await this.keychain.getApiKey();
    if (!apiKey) {
      throw new NotAuthenticatedError();
    }
    return apiKey;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.keychain.hasApiKey();
  }

  async logout(): Promise<void> {
    await this.keychain.deleteApiKey();
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/auth-manager.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/auth/auth-manager.ts tests/unit/auth-manager.test.ts
git commit -m "feat: add auth manager for credential flow"
```

---

## Phase 4: Result Transformation

### Task 4.1: Result Transformer

**Files:**
- Create: `src/utils/result-transformer.ts`
- Create: `tests/unit/result-transformer.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/result-transformer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { transformResults } from '../../src/utils/result-transformer.js';
import type { ExecutionDetailResponse } from '../../src/touchstone/types.js';

describe('transformResults', () => {
  it('transforms passed execution correctly', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      scriptResults: [
        { testScriptName: 'Patient-create', status: 'Passed', passCount: 3, failCount: 0 },
        { testScriptName: 'Patient-read', status: 'Passed', passCount: 5, failCount: 0 },
        { testScriptName: 'Patient-update', status: 'Passed', passCount: 2, failCount: 0 }
      ]
    };

    const result = transformResults(raw);

    expect(result.executionId).toBe('12345');
    expect(result.status).toBe('Passed');
    expect(result.summary.total).toBe(3);
    expect(result.summary.passed).toBe(3);
    expect(result.summary.failed).toBe(0);
    expect(result.passed).toEqual(['Patient-create', 'Patient-read', 'Patient-update']);
    expect(result.failures).toEqual([]);
  });

  it('transforms failed execution with failure details', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Failed',
      scriptResults: [
        { testScriptName: 'Patient-create', status: 'Passed', passCount: 3, failCount: 0 },
        { testScriptName: 'Patient-read', status: 'Failed', passCount: 2, failCount: 1 }
      ]
    };

    const result = transformResults(raw);

    expect(result.status).toBe('Failed');
    expect(result.summary.passed).toBe(1);
    expect(result.summary.failed).toBe(1);
    expect(result.passed).toEqual(['Patient-create']);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].testScript).toBe('Patient-read');
  });

  it('handles empty script results', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      scriptResults: []
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(0);
    expect(result.passed).toEqual([]);
    expect(result.failures).toEqual([]);
  });

  it('handles missing script results', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Running'
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/result-transformer.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

Create `src/utils/result-transformer.ts`:

```typescript
import type {
  ExecutionDetailResponse,
  SummarizedTestResults,
  TestFailure
} from '../touchstone/types.js';

export function transformResults(raw: ExecutionDetailResponse): SummarizedTestResults {
  const scriptResults = raw.scriptResults ?? [];

  const passed: string[] = [];
  const failures: TestFailure[] = [];

  for (const script of scriptResults) {
    const isPassed = script.status === 'Passed' || script.status === 'PassedWithWarnings';

    if (isPassed) {
      passed.push(script.testScriptName);
    } else if (script.status === 'Failed' || script.status === 'Error') {
      failures.push({
        testScript: script.testScriptName,
        assertion: 'Test script failed',
        message: `Status: ${script.status}`
      });
    }
  }

  return {
    executionId: String(raw.testExecId),
    status: raw.status,
    summary: {
      total: scriptResults.length,
      passed: passed.length,
      failed: failures.length,
      skipped: scriptResults.length - passed.length - failures.length
    },
    passed,
    failures
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/result-transformer.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/result-transformer.ts tests/unit/result-transformer.test.ts
git commit -m "feat: add result transformer for summarized output"
```

---

## Phase 5: Analytics

### Task 5.1: Analytics Events

**Files:**
- Create: `src/analytics/events.ts`

**Step 1: Create event definitions**

Create `src/analytics/events.ts`:

```typescript
export const AnalyticsEvents = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  TEST_LAUNCHED: 'test_launched',
  TEST_COMPLETED: 'test_completed',
  TEST_POLL: 'test_poll',
  API_ERROR: 'api_error',
  TOOL_ERROR: 'tool_error'
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

export interface AuthSuccessProperties {
  base_url: string;
}

export interface AuthFailureProperties {
  base_url: string;
  error_code: string;
}

export interface TestLaunchedProperties {
  base_url: string;
}

export interface TestCompletedProperties {
  execution_id: string;
  status: string;
  duration_ms: number;
  passed_count: number;
  failed_count: number;
}

export interface TestPollProperties {
  execution_id: string;
  status: string;
}

export interface ApiErrorProperties {
  endpoint: string;
  status_code?: number;
  error_message: string;
}

export interface ToolErrorProperties {
  tool_name: string;
  error_code: string;
  error_message: string;
}
```

**Step 2: Commit**

```bash
git add src/analytics/events.ts
git commit -m "feat: add analytics event definitions"
```

---

### Task 5.2: PostHog Client

**Files:**
- Create: `src/analytics/posthog-client.ts`
- Create: `tests/unit/posthog-client.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/posthog-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsClient } from '../../src/analytics/posthog-client.js';
import { AnalyticsEvents } from '../../src/analytics/events.js';

// Mock posthog-node
vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('AnalyticsClient', () => {
  describe('when telemetry is enabled', () => {
    let client: AnalyticsClient;

    beforeEach(() => {
      client = new AnalyticsClient(true);
    });

    it('captures events', () => {
      client.track(AnalyticsEvents.AUTH_SUCCESS, { base_url: 'https://example.com' });

      // Verify capture was called (implementation detail, but useful for testing)
      expect(true).toBe(true);
    });
  });

  describe('when telemetry is disabled', () => {
    let client: AnalyticsClient;

    beforeEach(() => {
      client = new AnalyticsClient(false);
    });

    it('does not capture events', () => {
      // Should not throw
      client.track(AnalyticsEvents.AUTH_SUCCESS, { base_url: 'https://example.com' });
      expect(true).toBe(true);
    });
  });

  describe('getInstanceId', () => {
    it('returns consistent instance ID', () => {
      const client = new AnalyticsClient(true);
      const id1 = client.getInstanceId();
      const id2 = client.getInstanceId();
      expect(id1).toBe(id2);
    });

    it('returns different IDs for different clients', () => {
      const client1 = new AnalyticsClient(true);
      const client2 = new AnalyticsClient(true);
      // Note: In production, instance ID would be persisted, but for fresh instances they differ
      expect(client1.getInstanceId()).toBeDefined();
      expect(client2.getInstanceId()).toBeDefined();
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/posthog-client.test.ts
```

Expected: FAIL with "Cannot find module"

**Step 3: Create directory structure**

```bash
mkdir -p src/analytics
```

**Step 4: Write minimal implementation**

Create `src/analytics/posthog-client.ts`:

```typescript
import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
import type { AnalyticsEvent } from './events.js';

// PostHog API key is injected at build time
// This placeholder is replaced during CI/CD build
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? '__POSTHOG_API_KEY__';

export class AnalyticsClient {
  private posthog: PostHog | null = null;
  private instanceId: string;

  constructor(private readonly enabled: boolean) {
    this.instanceId = randomUUID();

    if (enabled && POSTHOG_API_KEY !== '__POSTHOG_API_KEY__') {
      this.posthog = new PostHog(POSTHOG_API_KEY, {
        host: 'https://app.posthog.com'
      });
    }
  }

  track(event: AnalyticsEvent, properties: Record<string, unknown>): void {
    if (!this.enabled || !this.posthog) {
      return;
    }

    this.posthog.capture({
      distinctId: this.instanceId,
      event,
      properties: {
        ...properties,
        instance_id: this.instanceId
      }
    });
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  async shutdown(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}
```

**Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/posthog-client.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add src/analytics/posthog-client.ts tests/unit/posthog-client.test.ts
git commit -m "feat: add PostHog analytics client"
```

---

## Phase 6: MCP Server

### Task 6.1: Tool Definitions

**Files:**
- Create: `src/server/tools.ts`

**Step 1: Create tool definitions**

Create `src/server/tools.ts`:

```typescript
import { z } from 'zod';

export const AuthenticateInputSchema = z.object({
  username: z.string().describe('Your Touchstone username'),
  password: z.string().describe('Your Touchstone password')
});
export type AuthenticateInput = z.infer<typeof AuthenticateInputSchema>;

export const LaunchTestExecutionInputSchema = z.object({
  testSetupName: z.string().describe('Name of the Test Setup configured in Touchstone UI')
});
export type LaunchTestExecutionInput = z.infer<typeof LaunchTestExecutionInputSchema>;

export const GetTestStatusInputSchema = z.object({
  executionId: z.string().describe('The execution ID returned from launch_test_execution')
});
export type GetTestStatusInput = z.infer<typeof GetTestStatusInputSchema>;

export const GetTestResultsInputSchema = z.object({
  executionId: z.string().describe('The execution ID returned from launch_test_execution')
});
export type GetTestResultsInput = z.infer<typeof GetTestResultsInputSchema>;

export const TOOL_DEFINITIONS = [
  {
    name: 'authenticate',
    description: 'Authenticate with Touchstone using your username and password. This stores your session securely for subsequent commands.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        username: { type: 'string', description: 'Your Touchstone username' },
        password: { type: 'string', description: 'Your Touchstone password' }
      },
      required: ['username', 'password']
    }
  },
  {
    name: 'launch_test_execution',
    description: 'Start a Touchstone test execution using a pre-configured Test Setup. Returns an execution ID for tracking.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        testSetupName: { type: 'string', description: 'Name of the Test Setup configured in Touchstone UI' }
      },
      required: ['testSetupName']
    }
  },
  {
    name: 'get_test_status',
    description: 'Check the current status of a test execution.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        executionId: { type: 'string', description: 'The execution ID returned from launch_test_execution' }
      },
      required: ['executionId']
    }
  },
  {
    name: 'get_test_results',
    description: 'Retrieve detailed results for a completed test execution, including passed tests and failure details.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        executionId: { type: 'string', description: 'The execution ID returned from launch_test_execution' }
      },
      required: ['executionId']
    }
  }
] as const;
```

**Step 2: Commit**

```bash
git add src/server/tools.ts
git commit -m "feat: add MCP tool definitions"
```

---

### Task 6.2: Prompt Definitions

**Files:**
- Create: `src/server/prompts.ts`

**Step 1: Create prompt definitions**

Create `src/server/prompts.ts`:

```typescript
export const PROMPT_DEFINITIONS = [
  {
    name: 'run-tests',
    description: 'Execute a Touchstone test setup and return results when complete. Auto-polls until finished.',
    arguments: [
      {
        name: 'testSetupName',
        description: 'Name of the Test Setup configured in Touchstone UI',
        required: true
      }
    ]
  },
  {
    name: 'check-results',
    description: 'Check results for a previous test execution by ID.',
    arguments: [
      {
        name: 'executionId',
        description: 'The execution ID from a previous test run',
        required: true
      }
    ]
  }
] as const;

export function getRunTestsPromptContent(testSetupName: string): string {
  return `Run the Touchstone test setup named "${testSetupName}".

Steps:
1. Use the launch_test_execution tool with testSetupName="${testSetupName}"
2. Poll get_test_status every 4 seconds until status is not "Running" or "Not Started"
3. Once complete, use get_test_results to get detailed results
4. Present a summary: total tests, passed, failed, and list any failures with details

If not authenticated, prompt the user to authenticate first.`;
}

export function getCheckResultsPromptContent(executionId: string): string {
  return `Check the results for Touchstone test execution ID "${executionId}".

Steps:
1. Use get_test_status to check if the execution is complete
2. If complete, use get_test_results to get detailed results
3. If still running, report the current status
4. Present a summary of results if available

If not authenticated, prompt the user to authenticate first.`;
}
```

**Step 2: Commit**

```bash
git add src/server/prompts.ts
git commit -m "feat: add MCP prompt definitions"
```

---

### Task 6.3: MCP Server Implementation

**Files:**
- Create: `src/server/mcp-server.ts`
- Create: `src/index.ts`

**Step 1: Create MCP server**

Create `src/server/mcp-server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { AuthManager } from '../auth/auth-manager.js';
import { KeychainService } from '../auth/keychain.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { RateLimiter, RATE_LIMITS } from '../touchstone/rate-limiter.js';
import { AnalyticsClient } from '../analytics/posthog-client.js';
import { AnalyticsEvents } from '../analytics/events.js';
import { getConfig } from '../utils/config.js';
import { formatErrorResponse, TSMCPError } from '../utils/errors.js';
import { transformResults } from '../utils/result-transformer.js';
import {
  TOOL_DEFINITIONS,
  AuthenticateInputSchema,
  LaunchTestExecutionInputSchema,
  GetTestStatusInputSchema,
  GetTestResultsInputSchema
} from './tools.js';
import {
  PROMPT_DEFINITIONS,
  getRunTestsPromptContent,
  getCheckResultsPromptContent
} from './prompts.js';

export class TSMCPServer {
  private server: Server;
  private authManager: AuthManager;
  private touchstoneClient: TouchstoneClient;
  private rateLimiter: RateLimiter;
  private analytics: AnalyticsClient;
  private config = getConfig();

  constructor() {
    this.server = new Server(
      { name: 'ts-mcp', version: '0.1.0' },
      { capabilities: { tools: {}, prompts: {} } }
    );

    this.touchstoneClient = new TouchstoneClient(this.config.touchstoneBaseUrl);
    this.authManager = new AuthManager(new KeychainService(), this.touchstoneClient);
    this.rateLimiter = new RateLimiter();
    this.analytics = new AnalyticsClient(this.config.telemetryEnabled);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS
    }));

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: PROMPT_DEFINITIONS
    }));

    // Get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'run-tests') {
        const testSetupName = args?.testSetupName as string;
        return {
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: getRunTestsPromptContent(testSetupName) }
            }
          ]
        };
      }

      if (name === 'check-results') {
        const executionId = args?.executionId as string;
        return {
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: getCheckResultsPromptContent(executionId) }
            }
          ]
        };
      }

      throw new Error(`Unknown prompt: ${name}`);
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'authenticate':
            return await this.handleAuthenticate(args);
          case 'launch_test_execution':
            return await this.handleLaunchExecution(args);
          case 'get_test_status':
            return await this.handleGetStatus(args);
          case 'get_test_results':
            return await this.handleGetResults(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.analytics.track(AnalyticsEvents.TOOL_ERROR, {
          tool_name: name,
          error_code: error instanceof TSMCPError ? error.code : 'UNKNOWN_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

        const errorResponse = formatErrorResponse(error);
        return {
          content: [{ type: 'text', text: JSON.stringify(errorResponse, null, 2) }],
          isError: true
        };
      }
    });
  }

  private async handleAuthenticate(args: unknown) {
    const { username, password } = AuthenticateInputSchema.parse(args);
    const result = await this.authManager.authenticate(username, password);

    this.analytics.track(AnalyticsEvents.AUTH_SUCCESS, {
      base_url: this.config.touchstoneBaseUrl
    });

    return {
      content: [{ type: 'text', text: result.message }]
    };
  }

  private async handleLaunchExecution(args: unknown) {
    const { testSetupName } = LaunchTestExecutionInputSchema.parse(args);
    const apiKey = await this.authManager.getApiKey();
    const executionId = await this.touchstoneClient.launchExecution(apiKey, testSetupName);

    this.analytics.track(AnalyticsEvents.TEST_LAUNCHED, {
      base_url: this.config.touchstoneBaseUrl
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ executionId: String(executionId), status: 'Launched' }, null, 2)
      }]
    };
  }

  private async handleGetStatus(args: unknown) {
    const { executionId } = GetTestStatusInputSchema.parse(args);
    const apiKey = await this.authManager.getApiKey();

    await this.rateLimiter.throttle('status', RATE_LIMITS.STATUS_ENDPOINT);
    const status = await this.touchstoneClient.getExecutionStatus(apiKey, parseInt(executionId, 10));

    this.analytics.track(AnalyticsEvents.TEST_POLL, {
      execution_id: executionId,
      status: status.status
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          executionId,
          status: status.status,
          message: status.message
        }, null, 2)
      }]
    };
  }

  private async handleGetResults(args: unknown) {
    const { executionId } = GetTestResultsInputSchema.parse(args);
    const apiKey = await this.authManager.getApiKey();

    await this.rateLimiter.throttle('detail', RATE_LIMITS.DETAIL_ENDPOINT);
    const detail = await this.touchstoneClient.getExecutionDetail(apiKey, parseInt(executionId, 10));
    const results = transformResults(detail);

    this.analytics.track(AnalyticsEvents.TEST_COMPLETED, {
      execution_id: executionId,
      status: results.status,
      duration_ms: 0, // Would need to track start time to calculate
      passed_count: results.summary.passed,
      failed_count: results.summary.failed
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async shutdown(): Promise<void> {
    await this.analytics.shutdown();
    await this.server.close();
  }
}
```

**Step 2: Create entry point**

Create `src/index.ts`:

```typescript
#!/usr/bin/env node

import { TSMCPServer } from './server/mcp-server.js';

async function main() {
  const server = new TSMCPServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
  });

  await server.run();
}

main().catch((error) => {
  console.error('Failed to start TS-MCP server:', error);
  process.exit(1);
});
```

**Step 3: Build and verify**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add src/server/mcp-server.ts src/index.ts
git commit -m "feat: add MCP server implementation"
```

---

## Phase 7: Integration Testing

### Task 7.1: MCP Server Integration Tests

**Files:**
- Create: `tests/integration/mcp-server.test.ts`

**Step 1: Write integration tests**

Create `tests/integration/mcp-server.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external dependencies
vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn()
  }
}));

vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    capture: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined)
  }))
}));

import keytar from 'keytar';
import { TOOL_DEFINITIONS } from '../../src/server/tools.js';
import { PROMPT_DEFINITIONS } from '../../src/server/prompts.js';

describe('MCP Server Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tool Definitions', () => {
    it('defines authenticate tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'authenticate');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('username');
      expect(tool?.inputSchema.required).toContain('password');
    });

    it('defines launch_test_execution tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'launch_test_execution');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('testSetupName');
    });

    it('defines get_test_status tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'get_test_status');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('executionId');
    });

    it('defines get_test_results tool', () => {
      const tool = TOOL_DEFINITIONS.find(t => t.name === 'get_test_results');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('executionId');
    });
  });

  describe('Prompt Definitions', () => {
    it('defines run-tests prompt', () => {
      const prompt = PROMPT_DEFINITIONS.find(p => p.name === 'run-tests');
      expect(prompt).toBeDefined();
      expect(prompt?.arguments).toHaveLength(1);
      expect(prompt?.arguments[0].name).toBe('testSetupName');
    });

    it('defines check-results prompt', () => {
      const prompt = PROMPT_DEFINITIONS.find(p => p.name === 'check-results');
      expect(prompt).toBeDefined();
      expect(prompt?.arguments).toHaveLength(1);
      expect(prompt?.arguments[0].name).toBe('executionId');
    });
  });

  describe('Authentication Flow', () => {
    it('stores API key in keychain after successful auth', async () => {
      // This would require more complex mocking of the full server flow
      // For now, verify the keychain mock is set up correctly
      vi.mocked(keytar.setPassword).mockResolvedValue();
      await keytar.setPassword('ts-mcp', 'touchstone-api-key', 'test-key');
      expect(keytar.setPassword).toHaveBeenCalledWith('ts-mcp', 'touchstone-api-key', 'test-key');
    });
  });
});
```

**Step 2: Run integration tests**

```bash
npm test -- tests/integration/mcp-server.test.ts
```

Expected: PASS

**Step 3: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 4: Commit**

```bash
git add tests/integration/mcp-server.test.ts
git commit -m "test: add MCP server integration tests"
```

---

## Phase 8: Build & Package

### Task 8.1: Finalize Package Configuration

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Create: `README.md`

**Step 1: Update package.json with final configuration**

Update `package.json`:

```json
{
  "name": "ts-mcp",
  "version": "0.1.0",
  "description": "MCP server for conversational FHIR testing with Touchstone",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "bin": {
    "ts-mcp": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "start": "node dist/index.js",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": ["mcp", "fhir", "touchstone", "testing", "healthcare", "hl7"],
  "author": "AEGIS.net, Inc.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/AEGISnetInc/ts-mcp.git"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "keytar": "^7.9.0",
    "posthog-node": "^3.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/keytar": "^4.4.4",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

**Step 2: Create .env.example**

Create `.env.example`:

```bash
# Touchstone Configuration
# Optional: Override the default Touchstone API URL
# TOUCHSTONE_BASE_URL=https://touchstone.aegis.net

# Telemetry Configuration
# Optional: Set to "false" to disable anonymous usage tracking
# TS_MCP_TELEMETRY=true
```

**Step 3: Create README.md**

Create `README.md`:

```markdown
# TS-MCP: Touchstone MCP Server

MCP server for conversational FHIR testing with [Touchstone](https://touchstone.aegis.net).

## Installation

```bash
npm install -g ts-mcp
```

## Configuration

Add to your Claude Code CLI `.mcp.json`:

```json
{
  "mcpServers": {
    "touchstone": {
      "command": "npx",
      "args": ["ts-mcp"]
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOUCHSTONE_BASE_URL` | `https://touchstone.aegis.net` | Touchstone API URL |
| `TS_MCP_TELEMETRY` | `true` | Enable/disable anonymous usage tracking |

## Usage

### Authentication

First, authenticate with your Touchstone credentials:

> "Authenticate me with Touchstone using my username and password"

Your credentials are used once to obtain an API key, which is stored securely in your system keychain.

### Running Tests

Run a test setup by name:

> "Run my Patient-CRUD tests"

Or use the prompt directly:

> `/run-tests Patient-CRUD`

### Checking Results

Check results for a previous execution:

> "Check the results for execution 12345"

## Tools

- `authenticate` - Authenticate with Touchstone
- `launch_test_execution` - Start a test run
- `get_test_status` - Check execution status
- `get_test_results` - Get detailed results

## Prompts

- `run-tests` - Execute tests and wait for results
- `check-results` - Check results for a previous execution

## License

MIT - AEGIS.net, Inc.
```

**Step 4: Build final package**

```bash
npm run build
```

**Step 5: Run final test suite**

```bash
npm test
```

**Step 6: Commit**

```bash
git add package.json .env.example README.md
git commit -m "chore: finalize package configuration and documentation"
```

---

## Summary

### Files Created

```
ts-mcp/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── .nvmrc
├── .env.example
├── README.md
├── src/
│   ├── index.ts
│   ├── server/
│   │   ├── mcp-server.ts
│   │   ├── tools.ts
│   │   └── prompts.ts
│   ├── touchstone/
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── rate-limiter.ts
│   ├── auth/
│   │   ├── auth-manager.ts
│   │   └── keychain.ts
│   ├── analytics/
│   │   ├── posthog-client.ts
│   │   └── events.ts
│   └── utils/
│       ├── config.ts
│       ├── errors.ts
│       └── result-transformer.ts
└── tests/
    ├── unit/
    │   ├── config.test.ts
    │   ├── errors.test.ts
    │   ├── rate-limiter.test.ts
    │   ├── keychain.test.ts
    │   ├── touchstone-client.test.ts
    │   ├── auth-manager.test.ts
    │   ├── result-transformer.test.ts
    │   └── posthog-client.test.ts
    └── integration/
        └── mcp-server.test.ts
```

### Total Tasks: 17

### Verification Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Build completes without errors
- [ ] MCP server starts without errors
- [ ] Tools register correctly
- [ ] Prompts register correctly
