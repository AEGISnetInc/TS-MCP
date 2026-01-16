# Change Log: Secure CLI Authentication

**Date:** 2026-01-16
**Type:** Security Fix
**Breaking Change:** Yes - `authenticate` MCP tool removed

## Summary

Removed the `authenticate` MCP tool to prevent password exposure in conversation history. Authentication is now performed via CLI command `npx ts-mcp auth`.

## Changes

### Added
- `src/cli/auth.ts` - Secure CLI authentication with hidden password input
- `docs/plans/2026-01-16-secure-cli-auth.md` - Design document
- `docs/logs/2026-01-16-secure-cli-auth.md` - This change log

### Modified
- `src/index.ts` - CLI command routing for `auth` and `--help`
- `src/server/tools.ts` - Removed `authenticate` tool (now 3 tools instead of 4)
- `src/server/mcp-server.ts` - Removed authenticate handler
- `src/auth/auth-manager.ts` - Simplified, no longer handles authentication
- `src/utils/errors.ts` - Updated error messages

### Removed
- `authenticate` MCP tool

## Migration

Users must now authenticate before using Claude Code with TS-MCP:

```bash
npx ts-mcp auth
```

This only needs to be done once (or when the session expires).

## Testing

1. Run `npm test` - all tests pass
2. Run `npm run build` - compiles successfully
3. Run `npx ts-mcp auth` - authenticates and stores API key
4. Use MCP tools in Claude Code - works without re-authenticating
