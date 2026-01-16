# Secure CLI Authentication

- **Date:** 2026-01-16
- **Status:** Implemented
- **Issue:** Password exposure in conversation history

## Problem

The previous `authenticate` MCP tool exposed user passwords in the Claude Code conversation history. When users typed "authenticate with username X and password Y", the password was visible in:
- The conversation transcript
- Any logs or history
- Screen shares or recordings

This is a serious security issue that needed immediate resolution.

## Solution

Move authentication to a separate CLI command that runs outside the Claude Code conversation:

```bash
npx ts-mcp auth
```

This command:
1. Prompts for username (visible)
2. Prompts for password (hidden - shows asterisks)
3. Authenticates with Touchstone API
4. Stores API key in system keychain
5. Subsequent MCP tool calls use the stored API key

## Implementation

### New Files
- `src/cli/auth.ts` - CLI authentication module with secure password input

### Modified Files
- `src/index.ts` - Added CLI command routing (`auth`, `--help`)
- `src/server/tools.ts` - Removed `authenticate` tool definition
- `src/server/mcp-server.ts` - Removed authenticate handler
- `src/auth/auth-manager.ts` - Simplified to keychain-only (no longer handles auth)
- `src/utils/errors.ts` - Updated error messages to reference `npx ts-mcp auth`

## User Experience

### Before (Insecure)
```
User: "Authenticate with user@example.com and password123"
Claude: [calls authenticate tool with VISIBLE password]
```

### After (Secure)
```bash
# In terminal (outside Claude Code)
$ npx ts-mcp auth
Touchstone username: user@example.com
Touchstone password: ********
✓ Authenticated successfully. API key stored in keychain.
```

```
# In Claude Code (API key already stored)
User: "Run my Patient tests"
Claude: [calls launch_test_execution - password never in conversation]
```

## Security Considerations

1. **Password never in conversation** - Entered via stdin with echo disabled
2. **API key in system keychain** - Encrypted by OS (macOS Keychain, Windows Credential Manager, Linux Secret Service)
3. **Session expiration handled** - Error message directs user to re-run `npx ts-mcp auth`

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx ts-mcp auth` | Authenticate with Touchstone |
| `npx ts-mcp --help` | Show help |
| `npx ts-mcp` | Start MCP server (used by Claude Code) |
