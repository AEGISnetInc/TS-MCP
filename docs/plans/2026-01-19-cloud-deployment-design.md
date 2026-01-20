# TS-MCP Cloud Deployment Design

- **Date:** 2026-01-19
- **Status:** Draft
- **Purpose:** Enable TS-MCP to run as a shared cloud service with per-user Touchstone authentication

## Overview

This design enables TS-MCP to run in a Docker container in the cloud, serving multiple developers who each authenticate with their own Touchstone credentials. The user experience remains consistent with local mode—users enter their Touchstone email and password via CLI—but the API key is stored server-side in PostgreSQL rather than in the local system keychain.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Developer's Machine                                │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐   │
│  │ Claude Code │────►│   ts-mcp    │────►│      System Keychain        │   │
│  │     CLI     │     │  (config)   │     │  (stores session token)     │   │
│  └─────────────┘     └─────────────┘     └─────────────────────────────┘   │
│         │                                                                    │
└─────────│────────────────────────────────────────────────────────────────────┘
          │ HTTPS (Streamable HTTP transport)
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Cloud (Docker)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      TS-MCP Server                                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ HTTP Server  │  │ Auth Service │  │   MCP Handler            │  │   │
│  │  │ (Express)    │──│              │  │ (StreamableHTTP)         │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                    │                       │                      │
│         ▼                    ▼                       ▼                      │
│  ┌─────────────┐     ┌─────────────┐        ┌─────────────────┐            │
│  │ PostgreSQL  │     │ Touchstone  │        │   Touchstone    │            │
│  │ (sessions)  │     │  Auth API   │        │   Test API      │            │
│  └─────────────┘     └─────────────┘        └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Differences from Local Mode

| Aspect | Local Mode | Cloud Mode |
|--------|------------|------------|
| Server location | Spawned locally by Claude Code | Running in Docker container |
| Transport | STDIO | Streamable HTTP (HTTPS) |
| API key storage | Local system keychain | PostgreSQL (encrypted) |
| User token storage | N/A | Session token in local keychain |
| Multi-user | No | Yes |

---

## Authentication Flow

### Login Flow

Users authenticate using the same Touchstone credentials they use for the Touchstone web UI:

```
┌──────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│   User   │          │   CLI    │          │ TS-MCP   │          │Touchstone│
│          │          │          │          │ Server   │          │   API    │
└────┬─────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                     │                     │                     │
     │ ts-mcp login        │                     │                     │
     │────────────────────►│                     │                     │
     │                     │                     │                     │
     │ "Username:"         │                     │                     │
     │◄────────────────────│                     │                     │
     │ user@example.com    │                     │                     │
     │────────────────────►│                     │                     │
     │                     │                     │                     │
     │ "Password:"         │                     │                     │
     │◄────────────────────│                     │                     │
     │ ********            │                     │                     │
     │────────────────────►│                     │                     │
     │                     │                     │                     │
     │                     │ POST /auth/login    │                     │
     │                     │ {username, password}│                     │
     │                     │────────────────────►│                     │
     │                     │                     │                     │
     │                     │                     │ POST /api/auth      │
     │                     │                     │────────────────────►│
     │                     │                     │     API key         │
     │                     │                     │◄────────────────────│
     │                     │                     │                     │
     │                     │                     │ Store API key in DB │
     │                     │                     │ Create session      │
     │                     │                     │                     │
     │                     │ {session_token}     │                     │
     │                     │◄────────────────────│                     │
     │                     │                     │                     │
     │                     │ Store in keychain   │                     │
     │ "Logged in!"        │◄────────┐           │                     │
     │◄────────────────────│─────────┘           │                     │
```

### Two Tokens Involved

| Token | Issued by | Stored where | Purpose |
|-------|-----------|--------------|---------|
| Touchstone API key | Touchstone | TS-MCP server (PostgreSQL, encrypted) | Authenticate API calls to Touchstone |
| TS-MCP session token | TS-MCP server | User's local keychain | Authenticate user to TS-MCP server |

The user never sees or handles the Touchstone API key directly—it stays on the server.

---

## Database Schema

### Tables

```sql
-- Users (one row per Touchstone user who has logged in)
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    touchstone_user  VARCHAR(255) UNIQUE NOT NULL,  -- Touchstone username/email
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at    TIMESTAMPTZ,

    INDEX idx_users_touchstone (touchstone_user)
);

-- Sessions (links session token to user and their Touchstone API key)
CREATE TABLE sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token   VARCHAR(64) UNIQUE NOT NULL,
    api_key_enc     BYTEA NOT NULL,               -- Touchstone API key (encrypted)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    INDEX idx_sessions_token (session_token),
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_expires (expires_at)
);

-- Audit log
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id      UUID REFERENCES sessions(id) ON DELETE SET NULL,
    event_type      VARCHAR(50) NOT NULL,
    event_data      JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    INDEX idx_audit_user (user_id),
    INDEX idx_audit_session (session_id),
    INDEX idx_audit_created (created_at)
);
```

### Encryption

- API keys encrypted using AES-256-GCM before storage
- Encryption key from environment variable (`TS_MCP_ENCRYPTION_KEY`)
- Each row gets unique IV (initialization vector)

### Session Lifecycle

| Event | Action |
|-------|--------|
| Login | Create session, set `expires_at` (default 30 days) |
| Each request | Update `last_used_at` |
| Logout | Delete session row |
| Expiry cleanup | Cron job deletes rows where `expires_at < NOW()` |

### Audit Event Types

| Event | When logged |
|-------|-------------|
| `login` | User authenticates successfully |
| `logout` | User explicitly logs out |
| `session_expired` | Session removed due to expiry |
| `tool_call` | User invokes an MCP tool (optional) |
| `auth_failed` | Failed login attempt |

---

## Server API Endpoints

### Authentication Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | CLI sends Touchstone credentials, receives session token |
| `/auth/logout` | POST | Invalidate session token |
| `/auth/status` | GET | Check if session is valid |

### MCP Endpoint

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | GET/POST | Streamable HTTP transport for MCP protocol |

### Request Authentication

All `/mcp` requests include the session token in headers:

```
Authorization: Bearer <session_token>
```

### MCP Request Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude Code │     │  TS-MCP     │     │ PostgreSQL  │     │ Touchstone  │
│             │     │  Server     │     │             │     │    API      │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ POST /mcp         │                   │                   │
       │ Authorization:    │                   │                   │
       │ Bearer <token>    │                   │                   │
       │ {launch_test...}  │                   │                   │
       │──────────────────►│                   │                   │
       │                   │                   │                   │
       │                   │ Lookup session    │                   │
       │                   │──────────────────►│                   │
       │                   │                   │                   │
       │                   │ user_id,          │                   │
       │                   │ api_key_enc       │                   │
       │                   │◄──────────────────│                   │
       │                   │                   │                   │
       │                   │ Decrypt API key   │                   │
       │                   │                   │                   │
       │                   │ POST /api/testExecution              │
       │                   │ X-API-Key: <decrypted>               │
       │                   │──────────────────────────────────────►│
       │                   │                   │                   │
       │                   │                   │   execution_id    │
       │                   │◄──────────────────────────────────────│
       │                   │                   │                   │
       │ {executionId}     │                   │                   │
       │◄──────────────────│                   │                   │
```

---

## CLI Commands

### Command Summary

| Command | Purpose |
|---------|---------|
| `ts-mcp auth` | Authenticate for local mode (existing, unchanged) |
| `ts-mcp login [server-name]` | Authenticate with cloud server |
| `ts-mcp logout [server-name]` | Revoke session and remove from keychain |
| `ts-mcp status` | Show current auth status (local and cloud) |
| `ts-mcp` | Start local MCP server (existing, unchanged) |

### Example CLI Interactions

```bash
# Login to cloud server
$ ts-mcp login
Reading server URL from ~/.claude/mcp.json...
Server: https://ts-mcp.example.com

Username (email): dev@example.com
Password: ********

Authenticating...
✓ Logged in successfully. Session stored in keychain.

# Check status
$ ts-mcp status
Cloud server: https://ts-mcp.example.com
  Status: Authenticated
  User: dev@example.com
  Session expires: 2026-02-18

Local mode: Not configured

# Logout
$ ts-mcp logout
✓ Logged out from https://ts-mcp.example.com
```

### Server URL Resolution

The CLI reads the server URL from `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "touchstone": {
      "url": "https://ts-mcp.example.com/mcp"
    }
  }
}
```

If multiple MCP servers are configured, the user specifies which one:

```bash
ts-mcp login touchstone
```

### Keychain Storage

| Mode | Service Name | Account Name | Stores |
|------|--------------|--------------|--------|
| Local | `ts-mcp` | `touchstone-api-key` | Touchstone API key |
| Cloud | `ts-mcp` | `session:<server-url>` | Session token |

---

## Server Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TS_MCP_MODE` | Yes | `local` (default) or `cloud` |
| `TS_MCP_ENCRYPTION_KEY` | Cloud only | 32-byte key for encrypting API keys (base64) |
| `DATABASE_URL` | Cloud only | PostgreSQL connection string |
| `TOUCHSTONE_BASE_URL` | No | Defaults to `https://touchstone.aegis.net` |
| `TS_MCP_SESSION_TTL_DAYS` | No | Session lifetime, defaults to `30` |
| `TS_MCP_TELEMETRY` | No | `true` (default) or `false` |
| `PORT` | No | HTTP port, defaults to `3000` |

### Docker Compose Example

```yaml
version: '3.8'

services:
  ts-mcp:
    image: ts-mcp:latest
    environment:
      TS_MCP_MODE: cloud
      TS_MCP_ENCRYPTION_KEY: ${TS_MCP_ENCRYPTION_KEY}
      DATABASE_URL: postgres://user:pass@postgres:5432/tsmcp
      TOUCHSTONE_BASE_URL: https://touchstone.aegis.net
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: tsmcp
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Server Startup Behavior

| Mode | Transport | Auth Source |
|------|-----------|-------------|
| `local` | STDIO | System keychain |
| `cloud` | Streamable HTTP | PostgreSQL sessions |

---

## Code Structure

### New and Modified Files

```
src/
├── index.ts                    # Updated: route to local or cloud mode
├── cli/
│   ├── auth.ts                 # Existing: local auth (unchanged)
│   ├── login.ts                # NEW: cloud login command
│   ├── logout.ts               # NEW: cloud logout command
│   └── status.ts               # NEW: show auth status
├── server/
│   ├── mcp-server.ts           # Updated: accept injected auth provider
│   ├── http-server.ts          # NEW: Express + Streamable HTTP transport
│   ├── tools.ts                # Unchanged
│   └── prompts.ts              # Unchanged
├── auth/
│   ├── keychain.ts             # Unchanged
│   ├── auth-manager.ts         # Updated: interface for different providers
│   ├── local-auth-provider.ts  # NEW: wraps keychain (extracted from auth-manager)
│   └── cloud-auth-provider.ts  # NEW: validates session, returns API key
├── db/
│   ├── client.ts               # NEW: PostgreSQL connection
│   ├── sessions.ts             # NEW: session CRUD operations
│   ├── users.ts                # NEW: user CRUD operations
│   └── migrations/             # NEW: schema migrations
│       └── 001_initial.sql
└── crypto/
    └── encryption.ts           # NEW: AES-256-GCM encrypt/decrypt
```

### Auth Provider Interface

```typescript
interface AuthProvider {
  getApiKey(context: RequestContext): Promise<string>;
}

// Local mode: reads from keychain
class LocalAuthProvider implements AuthProvider {
  async getApiKey(): Promise<string> {
    return this.keychain.getApiKey();
  }
}

// Cloud mode: looks up session, decrypts API key
class CloudAuthProvider implements AuthProvider {
  async getApiKey(context: RequestContext): Promise<string> {
    const token = context.sessionToken;
    const session = await this.db.sessions.findByToken(token);
    return this.crypto.decrypt(session.api_key_enc);
  }
}
```

### Transport-Agnostic MCP Server

```typescript
// mcp-server.ts - works with any transport and auth provider
class TSMCPServer {
  constructor(
    private authProvider: AuthProvider,
    private server: Server
  ) {}

  // Tool handlers unchanged - just call authProvider.getApiKey()
}
```

---

## User Experience Comparison

| Step | Local Mode | Cloud Mode |
|------|------------|------------|
| Install | `npm install -g ts-mcp` | None (server already running) |
| Configure | Add command to `mcp.json` | Add URL to `mcp.json` |
| Authenticate | `ts-mcp auth` | `ts-mcp login` |
| Credentials | Touchstone email + password | Touchstone email + password |
| Use in Claude | Identical | Identical |

---

## Security Considerations

### Credentials in Transit

- All communication over HTTPS
- Touchstone credentials sent CLI → TS-MCP server → Touchstone API
- Credentials never stored; only the resulting API key is persisted

### API Key Storage

- Encrypted with AES-256-GCM before storage in PostgreSQL
- Encryption key stored as environment variable (not in database)
- Each API key encrypted with unique IV

### Session Tokens

- Opaque random strings (no embedded data)
- Stored in user's local system keychain
- Server-side revocation supported (delete from database)

### Audit Trail

- All logins, logouts, and optionally tool calls logged
- Queryable by user or session
- Supports compliance requirements

---

## Future Considerations

### Potential Enhancements

| Enhancement | Value |
|-------------|-------|
| Session limits | Max N active sessions per user |
| IP restrictions | Restrict sessions to specific IP ranges |
| MFA support | Require second factor for login |
| Admin dashboard | Web UI for session management |
| SSO integration | Support enterprise identity providers |
