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
