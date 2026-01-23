# Global vs Project-Specific MCP Server Configuration

## Problem

When running Claude Code from the TS-MCP project directory, the MCP tools were connecting to the **local** STDIO server instead of the **cloud** server at `https://ts-mcp.fly.dev/mcp`, even though:
- Cloud authentication was valid (`npx ts-mcp status` showed authenticated)
- A global MCP server config pointed to the cloud URL

## Root Cause

Claude Code's `~/.claude.json` has two places where MCP servers can be configured:

1. **Global** - top-level `mcpServers` object (applies everywhere)
2. **Project-specific** - nested under `projects.<path>.mcpServers` (applies only in that directory)

**Project-specific settings override global settings.**

In this case:
- Global config correctly pointed to cloud: `"url": "https://ts-mcp.fly.dev/mcp"`
- Project config (under `/Users/jeffhelman/DEV/TS-MCP`) was set to local STDIO mode

The project-specific entry was created during local development and never removed when switching to cloud.

## Symptoms

- `npx ts-mcp status` shows authenticated to cloud
- MCP tool calls return `SESSION_EXPIRED` error suggesting `npx ts-mcp auth` (local auth command)
- Confusion because cloud auth is valid but tools use local server

## Solution

Remove the project-specific MCP server entry so the global config takes effect:

```bash
claude mcp remove ts-mcp --project
```

Or manually edit `~/.claude.json` and empty the project's `mcpServers` object:

```json
"projects": {
  "/Users/jeffhelman/DEV/TS-MCP": {
    "mcpServers": {},
    ...
  }
}
```

**Restart Claude Code** after making the change.

## Config Structure Reference

```json
{
  "projects": {
    "/path/to/project": {
      "mcpServers": {
        "server-name": { ... }  // Project-specific (higher priority)
      }
    }
  },
  "mcpServers": {
    "server-name": { ... }  // Global (lower priority)
  }
}
```

## Lesson Learned

When switching from local to cloud MCP deployment, check for and remove any project-specific MCP configurations that might override the global setting.

---

## Problem 2: HTTP Transport Schema Validation (2026-01-22)

### Symptoms

- `/mcp` shows "No MCP servers configured"
- `/doctor` shows: `mcpServers.ts-mcp: Does not adhere to MCP server configuration schema`
- MCP tools not available despite config existing in `~/.claude.json`

### Root Cause

The config was manually edited or created with an outdated format:

```json
"mcpServers": {
  "ts-mcp": {
    "url": "https://ts-mcp.fly.dev/mcp"
  }
}
```

This format is **invalid**. HTTP-based MCP servers require explicit transport specification.

### Solution

Use the CLI to add HTTP MCP servers with the correct transport flag:

```bash
# Remove invalid config
claude mcp remove ts-mcp

# Add with correct HTTP transport format
claude mcp add --transport http ts-mcp https://ts-mcp.fly.dev/mcp
```

This creates the correct schema:

```json
"mcpServers": {
  "ts-mcp": {
    "type": "http",
    "url": "https://ts-mcp.fly.dev/mcp"
  }
}
```

### Verification

```bash
claude mcp list
# Should show: ts-mcp: https://ts-mcp.fly.dev/mcp (HTTP) - ✓ Connected
```

**Restart Claude Code** after making the change.

### Lesson Learned

Always use `claude mcp add` commands instead of manually editing `~/.claude.json`. The schema requirements may change and the CLI ensures correct format.

---

## Problem 3: Cloud MCP Authorization Header Required (2026-01-22)

### Symptoms

- `claude mcp list` shows "✗ Failed to connect" for the cloud HTTP server
- `npx ts-mcp status` shows valid cloud authentication
- Server health check (`/health`) returns 200 OK
- Direct curl requests without auth return session-related errors

### Root Cause

The cloud MCP server (`https://ts-mcp.fly.dev/mcp`) requires authentication via a Bearer token in the `Authorization` header. The session token is stored in the system keychain by `npx ts-mcp login`, but Claude Code's MCP client doesn't automatically retrieve and use this token.

When adding the MCP server with just:
```bash
claude mcp add --transport http ts-mcp https://ts-mcp.fly.dev/mcp
```

The connection fails because no authentication is provided.

### Solution

1. Get the session token from the keychain:
```bash
security find-generic-password -s ts-mcp -a 'session:https://ts-mcp.fly.dev' -w
```

2. Add the MCP server with the Authorization header:
```bash
claude mcp remove ts-mcp -s local
claude mcp add --transport http ts-mcp https://ts-mcp.fly.dev/mcp \
  --header "Authorization: Bearer <session-token>" -s local
```

### Verification

```bash
claude mcp list
# Should show: ts-mcp: https://ts-mcp.fly.dev/mcp (HTTP) - ✓ Connected
```

**Restart Claude Code** after making the change.

### Token Expiration

Session tokens expire (default 30 days). When the token expires:
1. Run `npx ts-mcp login` to get a new token
2. Re-run the `claude mcp add` command with the new token

Check expiration with `npx ts-mcp status`.

### Lesson Learned

Cloud MCP servers with session-based authentication require the session token to be passed via the `--header` flag. This is a manual step after `npx ts-mcp login`.

---

## Problem 4: Stale MCP Session State on Cloud Server (2026-01-22)

### Symptoms

- `claude mcp list` intermittently shows "✗ Failed to connect"
- Direct API calls return: `"Invalid Request: Server already initialized"`
- Connection worked previously but suddenly fails

### Root Cause

The MCP Streamable HTTP transport maintains session state on the server. If the server has stale session state from a previous client connection that wasn't properly cleaned up, new connections may fail with initialization errors.

This can happen when:
- A client disconnects unexpectedly
- The server process is long-running and accumulates state
- Multiple clients attempt to connect

### Solution

Restart the cloud server to clear session state:

```bash
fly apps restart ts-mcp
```

Wait a few seconds, then verify:
```bash
claude mcp list
# Should show: ts-mcp: https://ts-mcp.fly.dev/mcp (HTTP) - ✓ Connected
```

### Lesson Learned

If cloud MCP connections fail intermittently with session-related errors, restarting the server clears stale transport state. This may indicate an opportunity to improve the server's session cleanup logic.
