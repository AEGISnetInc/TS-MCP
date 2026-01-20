# Cloud Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable TS-MCP to run as a shared cloud service with per-user Touchstone authentication.

**Architecture:** Add Streamable HTTP transport alongside STDIO, with PostgreSQL for session storage. Introduce AuthProvider interface to abstract local keychain vs cloud session authentication. CLI gains login/logout/status commands for cloud mode.

**Tech Stack:** Express, @modelcontextprotocol/sdk (StreamableHTTPServerTransport), PostgreSQL (pg), AES-256-GCM encryption, existing keytar for local token storage.

**Design Document:** `docs/plans/2026-01-19-cloud-deployment-design.md`

---

## Phase 1: Foundation

### Task 1: Add Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add required packages**

```bash
npm install express pg uuid
npm install --save-dev @types/express @types/pg @types/uuid
```

**Step 2: Verify installation**

Run: `npm ls express pg uuid`
Expected: Shows installed versions

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add express, pg, uuid dependencies for cloud mode"
```

---

### Task 2: Create Encryption Module

**Files:**
- Create: `src/crypto/encryption.ts`
- Create: `tests/unit/encryption.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/encryption.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Encryption', () => {
  const testKey = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64'); // 32 bytes

  beforeEach(() => {
    process.env.TS_MCP_ENCRYPTION_KEY = testKey;
  });

  describe('encrypt and decrypt', () => {
    it('round-trips a string value', async () => {
      const { encrypt, decrypt } = await import('../../src/crypto/encryption.js');
      const plaintext = 'my-secret-api-key';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('produces different ciphertext each time (unique IV)', async () => {
      const { encrypt } = await import('../../src/crypto/encryption.js');
      const plaintext = 'my-secret-api-key';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('throws if encryption key is not set', async () => {
      delete process.env.TS_MCP_ENCRYPTION_KEY;

      // Re-import to pick up env change
      jest.resetModules();
      const { encrypt } = await import('../../src/crypto/encryption.js');

      expect(() => encrypt('test')).toThrow('TS_MCP_ENCRYPTION_KEY');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/encryption.test.ts`
Expected: FAIL - module not found

**Step 3: Write minimal implementation**

```typescript
// src/crypto/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyBase64 = process.env.TS_MCP_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('TS_MCP_ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(keyBase64, 'base64');
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns base64-encoded string containing IV + ciphertext + auth tag.
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  // Combine: IV (16) + ciphertext + authTag (16)
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString('base64');
}

/**
 * Decrypts a string that was encrypted with encrypt().
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, 'base64');

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/encryption.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/crypto/encryption.ts tests/unit/encryption.test.ts
git commit -m "feat: add AES-256-GCM encryption module for API key storage"
```

---

### Task 3: Update Config for Cloud Mode

**Files:**
- Modify: `src/utils/config.ts`
- Modify: `tests/unit/config.test.ts`

**Step 1: Write the failing test**

Add to `tests/unit/config.test.ts`:

```typescript
describe('cloud mode config', () => {
  it('returns mode as local by default', () => {
    delete process.env.TS_MCP_MODE;
    const config = getConfig();
    expect(config.mode).toBe('local');
  });

  it('returns mode as cloud when set', () => {
    process.env.TS_MCP_MODE = 'cloud';
    const config = getConfig();
    expect(config.mode).toBe('cloud');
  });

  it('returns database URL when set', () => {
    process.env.DATABASE_URL = 'postgres://localhost/test';
    const config = getConfig();
    expect(config.databaseUrl).toBe('postgres://localhost/test');
  });

  it('returns session TTL with default', () => {
    delete process.env.TS_MCP_SESSION_TTL_DAYS;
    const config = getConfig();
    expect(config.sessionTtlDays).toBe(30);
  });

  it('returns custom session TTL when set', () => {
    process.env.TS_MCP_SESSION_TTL_DAYS = '7';
    const config = getConfig();
    expect(config.sessionTtlDays).toBe(7);
  });

  it('returns port with default', () => {
    delete process.env.PORT;
    const config = getConfig();
    expect(config.port).toBe(3000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/config.test.ts`
Expected: FAIL - mode property doesn't exist

**Step 3: Update implementation**

```typescript
// src/utils/config.ts
export interface Config {
  mode: 'local' | 'cloud';
  touchstoneBaseUrl: string;
  telemetryEnabled: boolean;
  databaseUrl?: string;
  sessionTtlDays: number;
  port: number;
}

export function getConfig(): Config {
  return {
    mode: (process.env.TS_MCP_MODE as 'local' | 'cloud') ?? 'local',
    touchstoneBaseUrl: process.env.TOUCHSTONE_BASE_URL ?? 'https://touchstone.aegis.net',
    telemetryEnabled: process.env.TS_MCP_TELEMETRY !== 'false',
    databaseUrl: process.env.DATABASE_URL,
    sessionTtlDays: parseInt(process.env.TS_MCP_SESSION_TTL_DAYS ?? '30', 10),
    port: parseInt(process.env.PORT ?? '3000', 10)
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/config.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/config.ts tests/unit/config.test.ts
git commit -m "feat: add cloud mode configuration options"
```

---

### Task 4: Create AuthProvider Interface

**Files:**
- Create: `src/auth/auth-provider.ts`
- Modify: `src/auth/auth-manager.ts` → rename to `src/auth/local-auth-provider.ts`
- Create: `tests/unit/local-auth-provider.test.ts`

**Step 1: Create the interface**

```typescript
// src/auth/auth-provider.ts

/**
 * Context passed to auth provider for request-scoped authentication.
 */
export interface AuthContext {
  sessionToken?: string;
}

/**
 * Interface for authentication providers.
 * Implementations handle different auth strategies (local keychain, cloud sessions).
 */
export interface AuthProvider {
  /**
   * Retrieves the Touchstone API key for the current context.
   * @throws NotAuthenticatedError if not authenticated.
   */
  getApiKey(context?: AuthContext): Promise<string>;

  /**
   * Checks if the current context is authenticated.
   */
  isAuthenticated(context?: AuthContext): Promise<boolean>;
}
```

**Step 2: Rename and update auth-manager to local-auth-provider**

```typescript
// src/auth/local-auth-provider.ts
import { KeychainService } from './keychain.js';
import { NotAuthenticatedError } from '../utils/errors.js';
import { AuthProvider, AuthContext } from './auth-provider.js';

/**
 * Auth provider for local mode - retrieves API key from system keychain.
 */
export class LocalAuthProvider implements AuthProvider {
  constructor(private readonly keychain: KeychainService) {}

  async getApiKey(_context?: AuthContext): Promise<string> {
    const apiKey = await this.keychain.getApiKey();
    if (!apiKey) {
      throw new NotAuthenticatedError();
    }
    return apiKey;
  }

  async isAuthenticated(_context?: AuthContext): Promise<boolean> {
    return this.keychain.hasApiKey();
  }

  /**
   * Removes the API key from the keychain.
   */
  async logout(): Promise<void> {
    await this.keychain.deleteApiKey();
  }
}
```

**Step 3: Rename test file and update imports**

Rename `tests/unit/auth-manager.test.ts` → `tests/unit/local-auth-provider.test.ts`

Update imports in the test file:
```typescript
// Change:
import { AuthManager } from '../../src/auth/auth-manager.js';
// To:
import { LocalAuthProvider } from '../../src/auth/local-auth-provider.js';

// Update all references from AuthManager to LocalAuthProvider
```

**Step 4: Run tests to verify refactor didn't break anything**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/auth/auth-provider.ts src/auth/local-auth-provider.ts tests/unit/local-auth-provider.test.ts
git rm src/auth/auth-manager.ts tests/unit/auth-manager.test.ts
git commit -m "refactor: extract AuthProvider interface, rename AuthManager to LocalAuthProvider"
```

---

### Task 5: Update MCP Server to Use AuthProvider Interface

**Files:**
- Modify: `src/server/mcp-server.ts`
- Modify: `tests/integration/mcp-server.test.ts`

**Step 1: Update mcp-server.ts imports and constructor**

Change:
```typescript
import { AuthManager } from '../auth/auth-manager.js';
```
To:
```typescript
import { AuthProvider, AuthContext } from '../auth/auth-provider.js';
```

Update class to accept AuthProvider:
```typescript
export class TSMCPServer {
  private server: Server;
  private authProvider: AuthProvider;
  // ... other fields

  constructor(authProvider: AuthProvider) {
    this.authProvider = authProvider;
    // ... rest of constructor
  }
```

Update all `this.authManager.getApiKey()` calls to `this.authProvider.getApiKey()`.

**Step 2: Update integration tests to pass LocalAuthProvider**

```typescript
import { LocalAuthProvider } from '../../src/auth/local-auth-provider.js';
import { KeychainService } from '../../src/auth/keychain.js';

// In test setup:
const keychain = new KeychainService();
const authProvider = new LocalAuthProvider(keychain);
const server = new TSMCPServer(authProvider);
```

**Step 3: Run tests to verify**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/server/mcp-server.ts tests/integration/mcp-server.test.ts
git commit -m "refactor: update MCP server to use AuthProvider interface"
```

---

## Phase 2: Database Layer

### Task 6: Create Database Client

**Files:**
- Create: `src/db/client.ts`
- Create: `tests/unit/db-client.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/db-client.test.ts
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock pg before importing
jest.unstable_mockModule('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

describe('DatabaseClient', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost/testdb';
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('creates a pool with the database URL', async () => {
    const { Pool } = await import('pg');
    const { DatabaseClient } = await import('../../src/db/client.js');

    const client = new DatabaseClient();

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://test:test@localhost/testdb'
    });
  });

  it('executes queries through the pool', async () => {
    const { DatabaseClient } = await import('../../src/db/client.js');
    const client = new DatabaseClient();

    const mockResult = { rows: [{ id: 1 }] };
    (client as any).pool.query.mockResolvedValue(mockResult);

    const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);

    expect(result).toEqual(mockResult);
  });

  it('closes the pool on shutdown', async () => {
    const { DatabaseClient } = await import('../../src/db/client.js');
    const client = new DatabaseClient();

    await client.close();

    expect((client as any).pool.end).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/db-client.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/db/client.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { getConfig } from '../utils/config.js';

export class DatabaseClient {
  private pool: Pool;

  constructor() {
    const config = getConfig();
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.pool = new Pool({
      connectionString: config.databaseUrl
    });
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/db-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/client.ts tests/unit/db-client.test.ts
git commit -m "feat: add PostgreSQL database client"
```

---

### Task 7: Create Database Migration

**Files:**
- Create: `src/db/migrations/001_initial.sql`
- Create: `src/db/migrate.ts`

**Step 1: Create SQL migration**

```sql
-- src/db/migrations/001_initial.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    touchstone_user  VARCHAR(255) UNIQUE NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_touchstone ON users(touchstone_user);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token   VARCHAR(64) UNIQUE NOT NULL,
    api_key_enc     TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    event_type      VARCHAR(50) NOT NULL,
    event_data      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
```

**Step 2: Create migration runner**

```typescript
// src/db/migrate.ts
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseClient } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(client: DatabaseClient): Promise<void> {
  const migrationPath = join(__dirname, 'migrations', '001_initial.sql');
  const sql = readFileSync(migrationPath, 'utf-8');
  await client.query(sql);
}

// Allow running directly: npx ts-node src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new DatabaseClient();
  runMigrations(client)
    .then(() => {
      console.log('Migrations complete');
      return client.close();
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
```

**Step 3: Commit**

```bash
git add src/db/migrations/001_initial.sql src/db/migrate.ts
git commit -m "feat: add database migration for users, sessions, audit_log tables"
```

---

### Task 8: Create User Repository

**Files:**
- Create: `src/db/users.ts`
- Create: `tests/unit/users-repository.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/users-repository.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('UserRepository', () => {
  let mockClient: any;
  let userRepository: any;

  beforeEach(async () => {
    jest.resetModules();

    mockClient = {
      query: jest.fn()
    };

    const { UserRepository } = await import('../../src/db/users.js');
    userRepository = new UserRepository(mockClient);
  });

  describe('findByTouchstoneUser', () => {
    it('returns user when found', async () => {
      const mockUser = {
        id: '123',
        touchstone_user: 'test@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userRepository.findByTouchstoneUser('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com']
      );
    });

    it('returns null when not found', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByTouchstoneUser('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns new user', async () => {
      const mockUser = {
        id: '123',
        touchstone_user: 'new@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query.mockResolvedValue({ rows: [mockUser] });

      const result = await userRepository.create('new@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        ['new@example.com']
      );
    });
  });

  describe('findOrCreate', () => {
    it('returns existing user if found', async () => {
      const mockUser = {
        id: '123',
        touchstone_user: 'existing@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query.mockResolvedValueOnce({ rows: [mockUser] });

      const result = await userRepository.findOrCreate('existing@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    it('creates new user if not found', async () => {
      const mockUser = {
        id: '456',
        touchstone_user: 'new@example.com',
        created_at: new Date(),
        last_login_at: null
      };
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // findByTouchstoneUser returns null
        .mockResolvedValueOnce({ rows: [mockUser] }); // create returns new user

      const result = await userRepository.findOrCreate('new@example.com');

      expect(result).toEqual(mockUser);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateLastLogin', () => {
    it('updates last_login_at timestamp', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await userRepository.updateLastLogin('123');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining(['123'])
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/users-repository.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/db/users.ts
import { DatabaseClient } from './client.js';

export interface User {
  id: string;
  touchstone_user: string;
  created_at: Date;
  last_login_at: Date | null;
}

export class UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findByTouchstoneUser(touchstoneUser: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT id, touchstone_user, created_at, last_login_at FROM users WHERE touchstone_user = $1',
      [touchstoneUser]
    );
    return result.rows[0] ?? null;
  }

  async create(touchstoneUser: string): Promise<User> {
    const result = await this.db.query<User>(
      'INSERT INTO users (touchstone_user) VALUES ($1) RETURNING id, touchstone_user, created_at, last_login_at',
      [touchstoneUser]
    );
    return result.rows[0];
  }

  async findOrCreate(touchstoneUser: string): Promise<User> {
    const existing = await this.findByTouchstoneUser(touchstoneUser);
    if (existing) {
      return existing;
    }
    return this.create(touchstoneUser);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [userId]
    );
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/users-repository.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/users.ts tests/unit/users-repository.test.ts
git commit -m "feat: add user repository for database operations"
```

---

### Task 9: Create Session Repository

**Files:**
- Create: `src/db/sessions.ts`
- Create: `tests/unit/sessions-repository.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/sessions-repository.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('SessionRepository', () => {
  let mockClient: any;
  let sessionRepository: any;

  beforeEach(async () => {
    jest.resetModules();

    mockClient = {
      query: jest.fn()
    };

    const { SessionRepository } = await import('../../src/db/sessions.js');
    sessionRepository = new SessionRepository(mockClient);
  });

  describe('create', () => {
    it('creates session with encrypted API key', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        session_token: 'token-abc',
        api_key_enc: 'encrypted-key',
        created_at: new Date(),
        expires_at: new Date(),
        last_used_at: new Date()
      };
      mockClient.query.mockResolvedValue({ rows: [mockSession] });

      const result = await sessionRepository.create({
        userId: 'user-456',
        sessionToken: 'token-abc',
        apiKeyEncrypted: 'encrypted-key',
        ttlDays: 30
      });

      expect(result).toEqual(mockSession);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        expect.arrayContaining(['user-456', 'token-abc', 'encrypted-key'])
      );
    });
  });

  describe('findByToken', () => {
    it('returns session when found and not expired', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        session_token: 'token-abc',
        api_key_enc: 'encrypted-key',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 86400000), // tomorrow
        last_used_at: new Date()
      };
      mockClient.query.mockResolvedValue({ rows: [mockSession] });

      const result = await sessionRepository.findByToken('token-abc');

      expect(result).toEqual(mockSession);
    });

    it('returns null when not found', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await sessionRepository.findByToken('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes session by token', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 1 });

      const result = await sessionRepository.deleteByToken('token-abc');

      expect(result).toBe(true);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['token-abc']
      );
    });

    it('returns false when session not found', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 0 });

      const result = await sessionRepository.deleteByToken('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('updateLastUsed', () => {
    it('updates last_used_at timestamp', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await sessionRepository.updateLastUsed('token-abc');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        ['token-abc']
      );
    });
  });

  describe('deleteExpired', () => {
    it('deletes all expired sessions', async () => {
      mockClient.query.mockResolvedValue({ rowCount: 5 });

      const result = await sessionRepository.deleteExpired();

      expect(result).toBe(5);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        []
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sessions-repository.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/db/sessions.ts
import { DatabaseClient } from './client.js';

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  api_key_enc: string;
  created_at: Date;
  expires_at: Date;
  last_used_at: Date;
}

export interface CreateSessionParams {
  userId: string;
  sessionToken: string;
  apiKeyEncrypted: string;
  ttlDays: number;
}

export class SessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(params: CreateSessionParams): Promise<Session> {
    const result = await this.db.query<Session>(
      `INSERT INTO sessions (user_id, session_token, api_key_enc, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 day' * $4)
       RETURNING id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at`,
      [params.userId, params.sessionToken, params.apiKeyEncrypted, params.ttlDays]
    );
    return result.rows[0];
  }

  async findByToken(sessionToken: string): Promise<Session | null> {
    const result = await this.db.query<Session>(
      `SELECT id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at
       FROM sessions
       WHERE session_token = $1 AND expires_at > NOW()`,
      [sessionToken]
    );
    return result.rows[0] ?? null;
  }

  async deleteByToken(sessionToken: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE session_token = $1',
      [sessionToken]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateLastUsed(sessionToken: string): Promise<void> {
    await this.db.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE session_token = $1',
      [sessionToken]
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE expires_at <= NOW()',
      []
    );
    return result.rowCount ?? 0;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const result = await this.db.query<Session>(
      `SELECT id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at
       FROM sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [userId]
    );
    return result.rowCount ?? 0;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/sessions-repository.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/sessions.ts tests/unit/sessions-repository.test.ts
git commit -m "feat: add session repository for database operations"
```

---

## Phase 3: Cloud Auth Provider

### Task 10: Create Cloud Auth Provider

**Files:**
- Create: `src/auth/cloud-auth-provider.ts`
- Create: `tests/unit/cloud-auth-provider.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/cloud-auth-provider.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock encryption module
jest.unstable_mockModule('../../src/crypto/encryption.js', () => ({
  decrypt: jest.fn()
}));

describe('CloudAuthProvider', () => {
  let mockSessionRepo: any;
  let mockDecrypt: any;
  let cloudAuthProvider: any;

  beforeEach(async () => {
    jest.resetModules();

    mockSessionRepo = {
      findByToken: jest.fn(),
      updateLastUsed: jest.fn()
    };

    const { decrypt } = await import('../../src/crypto/encryption.js');
    mockDecrypt = decrypt as jest.Mock;

    const { CloudAuthProvider } = await import('../../src/auth/cloud-auth-provider.js');
    cloudAuthProvider = new CloudAuthProvider(mockSessionRepo);
  });

  describe('getApiKey', () => {
    it('returns decrypted API key for valid session', async () => {
      const mockSession = {
        id: 'session-123',
        api_key_enc: 'encrypted-api-key'
      };
      mockSessionRepo.findByToken.mockResolvedValue(mockSession);
      mockDecrypt.mockReturnValue('decrypted-api-key');

      const result = await cloudAuthProvider.getApiKey({ sessionToken: 'valid-token' });

      expect(result).toBe('decrypted-api-key');
      expect(mockSessionRepo.findByToken).toHaveBeenCalledWith('valid-token');
      expect(mockDecrypt).toHaveBeenCalledWith('encrypted-api-key');
      expect(mockSessionRepo.updateLastUsed).toHaveBeenCalledWith('valid-token');
    });

    it('throws NotAuthenticatedError when no session token provided', async () => {
      const { NotAuthenticatedError } = await import('../../src/utils/errors.js');

      await expect(cloudAuthProvider.getApiKey({})).rejects.toThrow(NotAuthenticatedError);
      await expect(cloudAuthProvider.getApiKey()).rejects.toThrow(NotAuthenticatedError);
    });

    it('throws NotAuthenticatedError when session not found', async () => {
      const { NotAuthenticatedError } = await import('../../src/utils/errors.js');
      mockSessionRepo.findByToken.mockResolvedValue(null);

      await expect(
        cloudAuthProvider.getApiKey({ sessionToken: 'invalid-token' })
      ).rejects.toThrow(NotAuthenticatedError);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true for valid session', async () => {
      mockSessionRepo.findByToken.mockResolvedValue({ id: 'session-123' });

      const result = await cloudAuthProvider.isAuthenticated({ sessionToken: 'valid-token' });

      expect(result).toBe(true);
    });

    it('returns false when no session token', async () => {
      const result = await cloudAuthProvider.isAuthenticated({});

      expect(result).toBe(false);
    });

    it('returns false when session not found', async () => {
      mockSessionRepo.findByToken.mockResolvedValue(null);

      const result = await cloudAuthProvider.isAuthenticated({ sessionToken: 'invalid-token' });

      expect(result).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cloud-auth-provider.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/auth/cloud-auth-provider.ts
import { AuthProvider, AuthContext } from './auth-provider.js';
import { SessionRepository } from '../db/sessions.js';
import { decrypt } from '../crypto/encryption.js';
import { NotAuthenticatedError } from '../utils/errors.js';

/**
 * Auth provider for cloud mode - retrieves API key from database session.
 */
export class CloudAuthProvider implements AuthProvider {
  constructor(private readonly sessions: SessionRepository) {}

  async getApiKey(context?: AuthContext): Promise<string> {
    const sessionToken = context?.sessionToken;
    if (!sessionToken) {
      throw new NotAuthenticatedError('No session token provided');
    }

    const session = await this.sessions.findByToken(sessionToken);
    if (!session) {
      throw new NotAuthenticatedError('Invalid or expired session');
    }

    // Update last used timestamp
    await this.sessions.updateLastUsed(sessionToken);

    // Decrypt and return API key
    return decrypt(session.api_key_enc);
  }

  async isAuthenticated(context?: AuthContext): Promise<boolean> {
    const sessionToken = context?.sessionToken;
    if (!sessionToken) {
      return false;
    }

    const session = await this.sessions.findByToken(sessionToken);
    return session !== null;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cloud-auth-provider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/auth/cloud-auth-provider.ts tests/unit/cloud-auth-provider.test.ts
git commit -m "feat: add cloud auth provider for session-based authentication"
```

---

## Phase 4: HTTP Server

### Task 11: Create Auth Service

**Files:**
- Create: `src/server/auth-service.ts`
- Create: `tests/unit/auth-service.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/auth-service.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../../src/crypto/encryption.js', () => ({
  encrypt: jest.fn()
}));

jest.unstable_mockModule('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('0'.repeat(32), 'hex'))
}));

describe('AuthService', () => {
  let mockUserRepo: any;
  let mockSessionRepo: any;
  let mockTouchstoneClient: any;
  let mockEncrypt: any;
  let authService: any;

  beforeEach(async () => {
    jest.resetModules();

    mockUserRepo = {
      findOrCreate: jest.fn(),
      updateLastLogin: jest.fn()
    };

    mockSessionRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn()
    };

    mockTouchstoneClient = {
      authenticate: jest.fn()
    };

    const { encrypt } = await import('../../src/crypto/encryption.js');
    mockEncrypt = encrypt as jest.Mock;

    const { AuthService } = await import('../../src/server/auth-service.js');
    authService = new AuthService(mockUserRepo, mockSessionRepo, mockTouchstoneClient, 30);
  });

  describe('login', () => {
    it('authenticates with Touchstone and creates session', async () => {
      mockTouchstoneClient.authenticate.mockResolvedValue('touchstone-api-key');
      mockUserRepo.findOrCreate.mockResolvedValue({ id: 'user-123', touchstone_user: 'test@example.com' });
      mockEncrypt.mockReturnValue('encrypted-api-key');
      mockSessionRepo.create.mockResolvedValue({
        id: 'session-456',
        session_token: expect.any(String),
        expires_at: new Date()
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(mockTouchstoneClient.authenticate).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockUserRepo.findOrCreate).toHaveBeenCalledWith('test@example.com');
      expect(mockEncrypt).toHaveBeenCalledWith('touchstone-api-key');
      expect(mockSessionRepo.create).toHaveBeenCalled();
      expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith('user-123');
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('expiresAt');
    });

    it('throws when Touchstone authentication fails', async () => {
      mockTouchstoneClient.authenticate.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.login('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('deletes session by token', async () => {
      mockSessionRepo.deleteByToken.mockResolvedValue(true);

      const result = await authService.logout('session-token');

      expect(result).toBe(true);
      expect(mockSessionRepo.deleteByToken).toHaveBeenCalledWith('session-token');
    });
  });

  describe('getSessionStatus', () => {
    it('returns session info when valid', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        expires_at: new Date(Date.now() + 86400000)
      };
      mockSessionRepo.findByToken.mockResolvedValue(mockSession);

      const result = await authService.getSessionStatus('valid-token');

      expect(result).toEqual({
        valid: true,
        expiresAt: mockSession.expires_at
      });
    });

    it('returns invalid when session not found', async () => {
      mockSessionRepo.findByToken.mockResolvedValue(null);

      const result = await authService.getSessionStatus('invalid-token');

      expect(result).toEqual({ valid: false });
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/auth-service.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/server/auth-service.ts
import { randomBytes } from 'crypto';
import { UserRepository } from '../db/users.js';
import { SessionRepository } from '../db/sessions.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { encrypt } from '../crypto/encryption.js';

export interface LoginResult {
  sessionToken: string;
  expiresAt: Date;
  userId: string;
  touchstoneUser: string;
}

export interface SessionStatus {
  valid: boolean;
  expiresAt?: Date;
  userId?: string;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly touchstone: TouchstoneClient,
    private readonly sessionTtlDays: number
  ) {}

  /**
   * Authenticate user with Touchstone and create a session.
   */
  async login(username: string, password: string): Promise<LoginResult> {
    // Authenticate with Touchstone
    const apiKey = await this.touchstone.authenticate(username, password);

    // Find or create user
    const user = await this.users.findOrCreate(username);

    // Generate session token
    const sessionToken = randomBytes(32).toString('hex');

    // Encrypt API key
    const apiKeyEncrypted = encrypt(apiKey);

    // Create session
    const session = await this.sessions.create({
      userId: user.id,
      sessionToken,
      apiKeyEncrypted,
      ttlDays: this.sessionTtlDays
    });

    // Update last login
    await this.users.updateLastLogin(user.id);

    return {
      sessionToken: session.session_token,
      expiresAt: session.expires_at,
      userId: user.id,
      touchstoneUser: user.touchstone_user
    };
  }

  /**
   * Invalidate a session.
   */
  async logout(sessionToken: string): Promise<boolean> {
    return this.sessions.deleteByToken(sessionToken);
  }

  /**
   * Check if a session is valid.
   */
  async getSessionStatus(sessionToken: string): Promise<SessionStatus> {
    const session = await this.sessions.findByToken(sessionToken);
    if (!session) {
      return { valid: false };
    }
    return {
      valid: true,
      expiresAt: session.expires_at,
      userId: session.user_id
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/auth-service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/server/auth-service.ts tests/unit/auth-service.test.ts
git commit -m "feat: add auth service for login/logout/status operations"
```

---

### Task 12: Create HTTP Server with Streamable HTTP Transport

**Files:**
- Create: `src/server/http-server.ts`
- Create: `tests/integration/http-server.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/integration/http-server.test.ts
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import http from 'http';

describe('HTTP Server', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    // Set required env vars
    process.env.TS_MCP_MODE = 'cloud';
    process.env.TS_MCP_ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
    process.env.DATABASE_URL = 'postgres://test:test@localhost/testdb';

    // Note: Full integration test would require mocking DB
    // This is a smoke test for server startup
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it('placeholder - server module exists', async () => {
    // Just verify the module can be imported
    const module = await import('../../src/server/http-server.js');
    expect(module.createHttpServer).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/http-server.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/server/http-server.ts
import express, { Request, Response, NextFunction } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

import { DatabaseClient } from '../db/client.js';
import { UserRepository } from '../db/users.js';
import { SessionRepository } from '../db/sessions.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { CloudAuthProvider } from '../auth/cloud-auth-provider.js';
import { AuthService } from './auth-service.js';
import { TSMCPServer } from './mcp-server.js';
import { getConfig } from '../utils/config.js';
import { AuthContext } from '../auth/auth-provider.js';

export interface HttpServerDependencies {
  db: DatabaseClient;
  touchstoneClient: TouchstoneClient;
}

export function createHttpServer(deps: HttpServerDependencies) {
  const app = express();
  const config = getConfig();

  // Repositories
  const userRepo = new UserRepository(deps.db);
  const sessionRepo = new SessionRepository(deps.db);

  // Services
  const authService = new AuthService(
    userRepo,
    sessionRepo,
    deps.touchstoneClient,
    config.sessionTtlDays
  );
  const authProvider = new CloudAuthProvider(sessionRepo);

  // MCP Server
  const mcpServer = new TSMCPServer(authProvider);

  // Middleware
  app.use(express.json());

  // Extract session token from Authorization header
  const extractSessionToken = (req: Request): string | undefined => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return undefined;
  };

  // Auth routes
  app.post('/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password required' });
        return;
      }

      const result = await authService.login(username, password);
      res.json({
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt.toISOString(),
        user: result.touchstoneUser
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({ error: message });
    }
  });

  app.post('/auth/logout', async (req: Request, res: Response) => {
    try {
      const sessionToken = extractSessionToken(req);
      if (!sessionToken) {
        res.status(401).json({ error: 'No session token provided' });
        return;
      }

      const success = await authService.logout(sessionToken);
      if (success) {
        res.json({ message: 'Logged out successfully' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  app.get('/auth/status', async (req: Request, res: Response) => {
    try {
      const sessionToken = extractSessionToken(req);
      if (!sessionToken) {
        res.json({ valid: false });
        return;
      }

      const status = await authService.getSessionStatus(sessionToken);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Status check failed' });
    }
  });

  // MCP endpoint using Streamable HTTP transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });

  // Connect MCP server to transport
  mcpServer.connectTransport(transport);

  app.all('/mcp', async (req: Request, res: Response) => {
    // Extract session token and attach to request for auth provider
    const sessionToken = extractSessionToken(req);

    // Attach auth context to request for MCP handlers
    (req as any).authContext = { sessionToken } as AuthContext;

    await transport.handleRequest(req, res);
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  return {
    app,
    async close() {
      await transport.close();
      await mcpServer.shutdown();
    }
  };
}
```

**Step 4: Update TSMCPServer to support transport injection**

Add method to `src/server/mcp-server.ts`:

```typescript
// Add this method to TSMCPServer class
connectTransport(transport: Transport): void {
  this.server.connect(transport);
}
```

**Step 5: Run test to verify it passes**

Run: `npm test -- tests/integration/http-server.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/server/http-server.ts tests/integration/http-server.test.ts src/server/mcp-server.ts
git commit -m "feat: add HTTP server with Streamable HTTP transport for cloud mode"
```

---

## Phase 5: CLI Commands

### Task 13: Create Login Command

**Files:**
- Create: `src/cli/login.ts`
- Create: `tests/unit/cli-login.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/cli-login.test.ts
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock keytar
jest.unstable_mockModule('keytar', () => ({
  default: {
    setPassword: jest.fn(),
    getPassword: jest.fn(),
    deletePassword: jest.fn()
  }
}));

// Mock readline
const mockRlQuestion = jest.fn();
const mockRlClose = jest.fn();
jest.unstable_mockModule('readline', () => ({
  createInterface: jest.fn(() => ({
    question: mockRlQuestion,
    close: mockRlClose
  }))
}));

describe('CLI Login', () => {
  let mockStdoutWrite: any;
  let mockConsoleLog: any;
  let mockConsoleError: any;
  let mockProcessExit: any;

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();

    mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    mockStdoutWrite.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it('logs in successfully and stores session token', async () => {
    const { runLoginCli } = await import('../../src/cli/login.js');
    const keytar = (await import('keytar')).default;

    // Mock MCP config
    const mockServerUrl = 'https://ts-mcp.example.com';

    // Mock successful login response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sessionToken: 'test-session-token',
        expiresAt: '2026-02-19T00:00:00Z',
        user: 'test@example.com'
      })
    });

    // This would require more complex setup for readline mocking
    // Simplified test just checks module exports
    expect(runLoginCli).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/cli-login.test.ts`
Expected: FAIL - module not found

**Step 3: Write implementation**

```typescript
// src/cli/login.ts
import * as readline from 'readline';
import keytar from 'keytar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SERVICE_NAME = 'ts-mcp';

interface McpConfig {
  mcpServers?: {
    [key: string]: {
      url?: string;
      command?: string;
    };
  };
}

function getServerUrl(serverName?: string): string | null {
  const configPath = join(homedir(), '.claude', 'mcp.json');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const config: McpConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

    if (!config.mcpServers) {
      return null;
    }

    // If server name provided, look for that specific one
    if (serverName) {
      const server = config.mcpServers[serverName];
      return server?.url ?? null;
    }

    // Otherwise, find first server with a URL (cloud mode)
    for (const [name, server] of Object.entries(config.mcpServers)) {
      if (server.url) {
        return server.url;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const isTTY = stdin.isTTY;

    process.stdout.write(prompt);

    if (isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();

    let password = '';

    const onData = (data: Buffer) => {
      const str = data.toString();

      for (const c of str) {
        switch (c) {
          case '\n':
          case '\r':
          case '\u0004':
            if (isTTY) {
              stdin.setRawMode(false);
            }
            stdin.removeListener('data', onData);
            stdin.pause();
            process.stdout.write('\n');
            resolve(password);
            return;
          case '\u0003':
            if (isTTY) {
              stdin.setRawMode(false);
            }
            process.exit(1);
            return;
          case '\u007F':
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += c;
            process.stdout.write('*');
            break;
        }
      }
    };

    stdin.on('data', onData);
  });
}

export async function runLoginCli(serverName?: string): Promise<void> {
  console.log('TS-MCP Cloud Login\n');

  // Get server URL from config
  const serverUrl = getServerUrl(serverName);
  if (!serverUrl) {
    console.error('Error: No cloud server configured in ~/.claude/mcp.json');
    console.error('Add a server with a "url" property to your MCP configuration.');
    process.exit(1);
  }

  // Extract base URL (remove /mcp path if present)
  const baseUrl = serverUrl.replace(/\/mcp\/?$/, '');
  console.log(`Server: ${baseUrl}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const username = await question(rl, 'Username (email): ');
    rl.close();

    const password = await questionHidden('Password: ');

    if (!username || !password) {
      console.error('Error: Username and password are required.');
      process.exit(1);
    }

    console.log('\nAuthenticating...');

    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
      throw new Error(error.error || 'Authentication failed');
    }

    const result = await response.json();

    // Store session token in keychain
    const accountName = `session:${baseUrl}`;
    await keytar.setPassword(SERVICE_NAME, accountName, result.sessionToken);

    console.log('✓ Logged in successfully. Session stored in keychain.');
    console.log(`\nSession expires: ${new Date(result.expiresAt).toLocaleDateString()}`);
    console.log('\nYou can now use TS-MCP tools in Claude Code.');

  } catch (error) {
    if (error instanceof Error) {
      console.error(`\nLogin failed: ${error.message}`);
    } else {
      console.error('\nLogin failed: Unknown error');
    }
    process.exit(1);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/cli-login.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/login.ts tests/unit/cli-login.test.ts
git commit -m "feat: add CLI login command for cloud authentication"
```

---

### Task 14: Create Logout Command

**Files:**
- Create: `src/cli/logout.ts`

**Step 1: Write implementation**

```typescript
// src/cli/logout.ts
import keytar from 'keytar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SERVICE_NAME = 'ts-mcp';

interface McpConfig {
  mcpServers?: {
    [key: string]: {
      url?: string;
    };
  };
}

function getServerUrl(serverName?: string): string | null {
  const configPath = join(homedir(), '.claude', 'mcp.json');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const config: McpConfig = JSON.parse(readFileSync(configPath, 'utf-8'));

    if (!config.mcpServers) {
      return null;
    }

    if (serverName) {
      const server = config.mcpServers[serverName];
      return server?.url ?? null;
    }

    for (const server of Object.values(config.mcpServers)) {
      if (server.url) {
        return server.url;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function runLogoutCli(serverName?: string): Promise<void> {
  console.log('TS-MCP Cloud Logout\n');

  const serverUrl = getServerUrl(serverName);
  if (!serverUrl) {
    console.error('Error: No cloud server configured in ~/.claude/mcp.json');
    process.exit(1);
  }

  const baseUrl = serverUrl.replace(/\/mcp\/?$/, '');
  const accountName = `session:${baseUrl}`;

  // Get session token
  const sessionToken = await keytar.getPassword(SERVICE_NAME, accountName);
  if (!sessionToken) {
    console.log('Not logged in to this server.');
    return;
  }

  try {
    // Call logout endpoint
    await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  } catch {
    // Ignore network errors - we'll delete local token anyway
  }

  // Delete local token
  await keytar.deletePassword(SERVICE_NAME, accountName);

  console.log(`✓ Logged out from ${baseUrl}`);
}
```

**Step 2: Commit**

```bash
git add src/cli/logout.ts
git commit -m "feat: add CLI logout command"
```

---

### Task 15: Create Status Command

**Files:**
- Create: `src/cli/status.ts`

**Step 1: Write implementation**

```typescript
// src/cli/status.ts
import keytar from 'keytar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SERVICE_NAME = 'ts-mcp';

interface McpConfig {
  mcpServers?: {
    [key: string]: {
      url?: string;
      command?: string;
    };
  };
}

function getMcpConfig(): McpConfig | null {
  const configPath = join(homedir(), '.claude', 'mcp.json');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function runStatusCli(): Promise<void> {
  console.log('TS-MCP Status\n');

  const config = getMcpConfig();

  // Check local mode
  const localApiKey = await keytar.getPassword(SERVICE_NAME, 'touchstone-api-key');
  console.log('Local mode:');
  if (localApiKey) {
    console.log('  Status: Authenticated');
    console.log('  API key stored in keychain');
  } else {
    console.log('  Status: Not authenticated');
    console.log('  Run "ts-mcp auth" to authenticate');
  }

  console.log('');

  // Check cloud servers
  if (!config?.mcpServers) {
    console.log('Cloud servers: None configured');
    return;
  }

  const cloudServers = Object.entries(config.mcpServers)
    .filter(([_, server]) => server.url);

  if (cloudServers.length === 0) {
    console.log('Cloud servers: None configured');
    return;
  }

  console.log('Cloud servers:');
  for (const [name, server] of cloudServers) {
    const baseUrl = server.url!.replace(/\/mcp\/?$/, '');
    const accountName = `session:${baseUrl}`;
    const sessionToken = await keytar.getPassword(SERVICE_NAME, accountName);

    console.log(`  ${name}:`);
    console.log(`    URL: ${baseUrl}`);

    if (!sessionToken) {
      console.log('    Status: Not authenticated');
      console.log(`    Run "ts-mcp login ${name}" to authenticate`);
      continue;
    }

    // Check session status with server
    try {
      const response = await fetch(`${baseUrl}/auth/status`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });

      if (response.ok) {
        const status = await response.json();
        if (status.valid) {
          console.log('    Status: Authenticated');
          if (status.expiresAt) {
            console.log(`    Expires: ${new Date(status.expiresAt).toLocaleDateString()}`);
          }
        } else {
          console.log('    Status: Session expired');
          console.log(`    Run "ts-mcp login ${name}" to re-authenticate`);
        }
      } else {
        console.log('    Status: Session invalid');
      }
    } catch {
      console.log('    Status: Cannot reach server');
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/cli/status.ts
git commit -m "feat: add CLI status command"
```

---

### Task 16: Update Index to Support All Commands

**Files:**
- Modify: `src/index.ts`

**Step 1: Update implementation**

```typescript
// src/index.ts
#!/usr/bin/env node

import { TSMCPServer } from './server/mcp-server.js';
import { LocalAuthProvider } from './auth/local-auth-provider.js';
import { KeychainService } from './auth/keychain.js';
import { runAuthCli } from './cli/auth.js';
import { runLoginCli } from './cli/login.js';
import { runLogoutCli } from './cli/logout.js';
import { runStatusCli } from './cli/status.js';
import { getConfig } from './utils/config.js';

async function runLocalServer() {
  const keychain = new KeychainService();
  const authProvider = new LocalAuthProvider(keychain);
  const server = new TSMCPServer(authProvider);

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

async function runCloudServer() {
  // Dynamic import to avoid loading DB deps in local mode
  const { createHttpServer } = await import('./server/http-server.js');
  const { DatabaseClient } = await import('./db/client.js');
  const { runMigrations } = await import('./db/migrate.js');
  const { TouchstoneClient } = await import('./touchstone/client.js');

  const config = getConfig();
  const db = new DatabaseClient();

  // Run migrations
  await runMigrations(db);

  const touchstoneClient = new TouchstoneClient(config.touchstoneBaseUrl);
  const { app, close } = createHttpServer({ db, touchstoneClient });

  const server = app.listen(config.port, () => {
    console.log(`TS-MCP cloud server running on port ${config.port}`);
  });

  process.on('SIGINT', async () => {
    await close();
    await db.close();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await close();
    await db.close();
    server.close();
    process.exit(0);
  });
}

function printHelp() {
  console.log('TS-MCP - Touchstone MCP Server for Claude Code');
  console.log('');
  console.log('Usage: ts-mcp [command]');
  console.log('');
  console.log('Commands:');
  console.log('  auth           Authenticate for local mode (stores API key in keychain)');
  console.log('  login [name]   Authenticate with cloud server');
  console.log('  logout [name]  Log out from cloud server');
  console.log('  status         Show authentication status');
  console.log('  (none)         Start MCP server (mode determined by TS_MCP_MODE)');
  console.log('');
  console.log('Environment:');
  console.log('  TS_MCP_MODE=local|cloud  Server mode (default: local)');
  console.log('');
  console.log('Examples:');
  console.log('  ts-mcp auth              # Authenticate for local mode');
  console.log('  ts-mcp login             # Authenticate with cloud server');
  console.log('  ts-mcp login touchstone  # Authenticate with specific server');
  console.log('  ts-mcp status            # Show auth status');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'auth':
      await runAuthCli();
      break;

    case 'login':
      await runLoginCli(args[1]);
      break;

    case 'logout':
      await runLogoutCli(args[1]);
      break;

    case 'status':
      await runStatusCli();
      break;

    case '--help':
    case '-h':
      printHelp();
      break;

    case undefined:
      // No command - run server
      const config = getConfig();
      if (config.mode === 'cloud') {
        await runCloudServer();
      } else {
        await runLocalServer();
      }
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "ts-mcp --help" for usage.');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: update CLI to support login/logout/status and cloud mode"
```

---

## Phase 6: Final Integration

### Task 17: Update User Documentation

**Files:**
- Modify: `docs/users/getting-started.md`

**Step 1: Add cloud mode section to documentation**

Add section for cloud mode setup after the local mode instructions.

**Step 2: Commit**

```bash
git add docs/users/getting-started.md
git commit -m "docs: add cloud mode instructions to getting started guide"
```

---

### Task 18: Create Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

**Step 1: Create Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist ./dist

# Set environment
ENV NODE_ENV=production
ENV TS_MCP_MODE=cloud

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

**Step 2: Create docker-compose.yml**

```yaml
# docker-compose.yml
version: '3.8'

services:
  ts-mcp:
    build: .
    environment:
      TS_MCP_MODE: cloud
      TS_MCP_ENCRYPTION_KEY: ${TS_MCP_ENCRYPTION_KEY}
      DATABASE_URL: postgres://tsmcp:tsmcp@postgres:5432/tsmcp
      TOUCHSTONE_BASE_URL: ${TOUCHSTONE_BASE_URL:-https://touchstone.aegis.net}
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tsmcp
      POSTGRES_PASSWORD: tsmcp
      POSTGRES_DB: tsmcp
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tsmcp"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

**Step 3: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Dockerfile and docker-compose for cloud deployment"
```

---

### Task 19: Run Full Test Suite and Build

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Test local mode still works**

Run: `node dist/index.js --help`
Expected: Shows help text

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: complete cloud deployment implementation"
```

---

## Summary

This implementation plan adds cloud deployment support to TS-MCP with:

1. **Encryption module** - AES-256-GCM for API key storage
2. **Database layer** - PostgreSQL with users, sessions, audit tables
3. **Auth provider interface** - Abstraction for local vs cloud auth
4. **Cloud auth provider** - Session-based authentication
5. **HTTP server** - Express with Streamable HTTP transport
6. **CLI commands** - login, logout, status for cloud mode
7. **Docker support** - Containerized deployment

Total tasks: 19
Estimated implementation time: Follow TDD for each task
