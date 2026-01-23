# Claude Code Instructions for TS-MCP

## Project Overview

TS-MCP is an MCP (Model Context Protocol) server that enables conversational FHIR testing through Claude Code CLI by wrapping the Touchstone API.

## Tech Stack

- **Language:** TypeScript (ES2022, NodeNext modules)
- **Runtime:** Node.js >= 18
- **MCP SDK:** @modelcontextprotocol/sdk
- **Testing:** Jest with ts-jest (ESM mode)
- **Credential Storage:** keytar (cross-platform keychain)
- **Analytics:** PostHog
- **Validation:** Zod

## Key Commands

```bash
npm run build      # Compile TypeScript
npm test           # Run all tests
npm run dev        # Watch mode compilation
npm start          # Run the MCP server
```

## Testing Notes

- Tests use Jest with ESM support (`NODE_OPTIONS='--experimental-vm-modules'`)
- Jest config is in `jest.config.cjs` (CommonJS for ESM compatibility)
- Native module mocking requires `jest.unstable_mockModule()` BEFORE importing
- Import `jest` from `@jest/globals` for timer mocks and other jest functions

Example ESM mocking pattern:
```typescript
import { jest } from '@jest/globals';

// Mock BEFORE importing modules that use it
jest.unstable_mockModule('module-name', () => ({
  default: { fn: jest.fn() }
}));

// Import AFTER mocks are set up
const { MyClass } = await import('./my-module.js');
```

## Architecture Decisions

1. **STDIO Transport:** Uses STDIO for Claude Code CLI compatibility
2. **Keychain Storage:** API keys stored in system keychain, never in plain text
3. **Rate Limiting:** Respects Touchstone API limits (4s status, 15s detail)
4. **PostHog Key Injection:** API key injected at build time via CI/CD, not in source

## Important Files

### Core Server
- `src/server/mcp-server.ts` - Main MCP server implementation
- `src/server/tools.ts` - MCP tool definitions
- `src/server/prompts.ts` - MCP prompt definitions

### Authentication
- `src/auth/auth-provider.ts` - AuthProvider interface
- `src/auth/local-auth-provider.ts` - Keychain-based auth
- `src/auth/keychain.ts` - Secure credential storage

### CLI Commands
- `src/cli/auth.ts` - Authentication (`ts-mcp auth`)
- `src/cli/status.ts` - Auth status (`ts-mcp status`)

### Other
- `src/touchstone/client.ts` - Touchstone API wrapper

## Design Documents

- `docs/plans/2026-01-14-ts-mcp-use-case-1-design.md` - Feature design
- `docs/plans/2026-01-15-ts-mcp-implementation.md` - Implementation plan

## MCP Configuration

Configure TS-MCP as an MCP server for Claude Code:

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP
```

Verify with `claude mcp list`. Restart Claude Code after configuration changes.

## Known Limitations

- Test Setup names must be provided manually (Touchstone API doesn't support listing)
- See `docs/plans/touchstone-api-upgrade-proposal.md` for proposed API enhancements
