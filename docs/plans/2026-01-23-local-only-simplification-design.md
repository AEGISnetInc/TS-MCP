# TS-MCP Local-Only Simplification Design

## Overview

Simplify TS-MCP by removing cloud mode entirely. Single local mode with PostHog analytics for centralized visibility.

## Goals

1. **Simple setup:** Two commands to get started
2. **Auto-recovery:** Claude runs `auth` automatically when API key expires
3. **Smaller footprint:** Fewer files, fewer dependencies
4. **Complete analytics:** PostHog tracking with no opt-out

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx github:AEGISnetinc/TS-MCP` | Start MCP server (STDIO) |
| `npx github:AEGISnetinc/TS-MCP auth` | Authenticate with Touchstone |
| `npx github:AEGISnetinc/TS-MCP status` | Show auth status (prompts to auth if not) |
| `npx github:AEGISnetinc/TS-MCP --help` | Show help |

## MCP Configuration

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP
```

## Status Command Behavior

If authenticated:
```
TS-MCP Status

Authenticated: Yes
```

If not authenticated:
```
TS-MCP Status

Authenticated: No

Would you like to authenticate now? (Y/n): y

Touchstone Authentication

Username (email): user@example.com
Password: ********

Authenticating...
Authenticated successfully. API key stored in credential store.
```

## Error Handling & Auto-Recovery

When Touchstone API key expires:

1. `TouchstoneClient` receives 401 from Touchstone
2. Throws `TouchstoneApiKeyExpiredError` with action field:
   ```typescript
   {
     message: 'Touchstone API key expired',
     code: 'TOUCHSTONE_API_KEY_EXPIRED',
     action: 'npx github:AEGISnetinc/TS-MCP auth'
   }
   ```
3. MCP server formats error response with `action` at top level
4. Claude sees action, tells user, runs `auth` command automatically
5. User enters credentials
6. Claude retries the original request

## Files to Remove

### Cloud Server
- `src/server/proxy-server.ts`
- `src/server/http-server.ts`
- `src/server/auth-service.ts`

### Cloud Auth
- `src/cli/login.ts`
- `src/cli/logout.ts`
- `src/cli/serve.ts`
- `src/auth/cloud-auth-provider.ts`

### Database Layer
- `src/db/client.ts`
- `src/db/users.ts`
- `src/db/sessions.ts`
- `src/db/migrate.ts`
- `src/db/migrations/` (entire directory)

### Crypto
- `src/crypto/encryption.ts`

### Deployment
- `fly.toml`
- `.github/workflows/` (cloud CI/CD workflows)

### Tests
- `tests/unit/proxy-server.test.ts`
- `tests/unit/cli-serve.test.ts`
- `tests/unit/cli-login.test.ts`
- `tests/unit/cli-logout.test.ts`
- `tests/unit/cloud-auth-provider.test.ts`
- `tests/unit/db-client.test.ts`
- `tests/unit/sessions-repository.test.ts`
- `tests/unit/users-repository.test.ts`
- `tests/unit/encryption.test.ts`
- `tests/unit/auth-service.test.ts`
- `tests/integration/http-server.test.ts`

### Documentation
- `docs/plans/2026-01-19-cloud-deployment-design.md`
- `docs/plans/2026-01-19-cloud-deployment-implementation.md`
- `docs/plans/2026-01-22-dynamic-auth-proxy.md`
- `docs/rabbit-holes/global-vs-local-mcp-gyrations.md`

## Files to Modify

### `src/index.ts`
- Remove `serve` command routing
- Remove `login`/`logout` routing
- Make default (no args) start MCP server directly
- Remove `runCloudServer()` function
- Simplify help text

### `src/cli/status.ts`
- Remove cloud status checks
- Add prompt to authenticate if not authenticated
- Simplify output

### `src/utils/errors.ts`
- Change `TouchstoneApiKeyExpiredError` action to `auth`
- Remove `SessionExpiredError`

### `src/utils/config.ts`
- Remove `mode` config
- Remove cloud-specific config options
- Remove `TS_MCP_TELEMETRY` (no opt-out)

### `src/analytics/posthog-client.ts`
- Remove `enabled` flag/constructor parameter
- Always send if API key present

### `package.json`
- Remove dependencies: `pg`, `express`

### `dist/`
- Rebuild after changes

## Documentation Rewrite

### `README.md`
- What TS-MCP does (1-2 sentences)
- Quick start (3 steps)
- CLI commands table
- Environment variables (just `TOUCHSTONE_BASE_URL`)
- Link to getting-started guide

### `docs/users/getting-started.md`
- Prerequisites
- Step 1: Add to Claude Code
- Step 2: Authenticate
- Step 3: Use in Claude Code
- Example workflows
- Troubleshooting (simplified)

### `CLAUDE.md`
- Remove cloud references
- Update file lists
- Update MCP configuration

## CI/CD for PostHog

### GitHub Actions workflow (`.github/workflows/build.yml`)

1. Trigger on push to `main`
2. Set `POSTHOG_API_KEY` from GitHub repository secret
3. Run `npm run build`
4. Commit updated `dist/` back to repo

### Setup Required
1. Add `POSTHOG_API_KEY` as GitHub repository secret
2. Create workflow file

## Success Criteria

1. Two commands to get started
2. Auto-recovery when API key expires
3. ~20 files removed
4. No `pg`, `express` dependencies
5. Simple docs with single path
6. All tests pass
7. PostHog analytics working (no opt-out)

## Out of Scope

- Cloud mode (preserved in `Local-and-Cloud` branch)
- New features
