# Claude Code Instructions for TS-MCP

## Project Overview

TS-MCP is an MCP (Model Context Protocol) server that enables conversational FHIR testing through Claude Code CLI by wrapping the Touchstone API.

## Tech Stack

- **Language:** TypeScript (ES2022, NodeNext modules)
- **Runtime:** Node.js >= 18
- **MCP SDK:** @modelcontextprotocol/sdk
- **Testing:** Jest with ts-jest (ESM mode)
- **Credential Storage:** keytar (cross-platform keychain, local mode)
- **Analytics:** PostHog (opt-out supported)
- **Validation:** Zod
- **HTTP Server:** Express (cloud mode)
- **Database:** PostgreSQL with pg (cloud mode)
- **Encryption:** AES-256-GCM for API key storage (cloud mode)

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

1. **STDIO Transport (Local):** Local mode uses STDIO for Claude Code CLI compatibility
2. **HTTP Transport (Cloud):** Cloud mode uses Streamable HTTP via Express for multi-user deployments
3. **Keychain Storage (Local):** API keys stored in system keychain, never in plain text
4. **Database Sessions (Cloud):** Cloud mode stores encrypted API keys in PostgreSQL with session tokens
5. **AuthProvider Interface:** Abstraction layer allows swapping between local (keychain) and cloud (database) auth
6. **Rate Limiting:** Respects Touchstone API limits (4s status, 15s detail)
7. **PostHog Key Injection:** API key injected at build time via CI/CD, not in source

## Important Files

### Core Server
- `src/server/mcp-server.ts` - Main MCP server implementation
- `src/server/proxy-server.ts` - Cloud proxy (STDIO to HTTP with dynamic auth from keychain)
- `src/server/http-server.ts` - Express server with Streamable HTTP transport (cloud mode)
- `src/server/auth-service.ts` - Login/logout/status operations (cloud mode)
- `src/server/tools.ts` - MCP tool definitions
- `src/server/prompts.ts` - MCP prompt definitions

### Authentication
- `src/auth/auth-provider.ts` - AuthProvider interface
- `src/auth/local-auth-provider.ts` - Keychain-based auth (local mode)
- `src/auth/cloud-auth-provider.ts` - Session-based auth (cloud mode)
- `src/auth/keychain.ts` - Secure credential storage

### Database (Cloud Mode)
- `src/db/client.ts` - PostgreSQL connection wrapper
- `src/db/users.ts` - User repository
- `src/db/sessions.ts` - Session repository
- `src/db/migrate.ts` - Database migrations
- `src/db/migrations/001_initial.sql` - Schema

### CLI Commands
- `src/cli/serve.ts` - Serve command (`ts-mcp serve [--cloud]`)
- `src/cli/auth.ts` - Local authentication (`ts-mcp auth`)
- `src/cli/login.ts` - Cloud login (`ts-mcp login`)
- `src/cli/logout.ts` - Cloud logout (`ts-mcp logout`)
- `src/cli/status.ts` - Auth status (`ts-mcp status`)

### Other
- `src/touchstone/client.ts` - Touchstone API wrapper
- `src/crypto/encryption.ts` - AES-256-GCM encryption

## Design Documents

- `docs/plans/2026-01-14-ts-mcp-use-case-1-design.md` - Feature design
- `docs/plans/2026-01-15-ts-mcp-implementation.md` - Implementation plan
- `docs/plans/2026-01-19-cloud-deployment-design.md` - Cloud deployment design
- `docs/plans/2026-01-19-cloud-deployment-implementation.md` - Cloud deployment implementation plan
- `docs/plans/2026-01-22-dynamic-auth-proxy.md` - Dynamic auth proxy design

## MCP Configuration

Configure TS-MCP as an MCP server for Claude Code:

```bash
# Local mode (STDIO)
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve

# Cloud mode (STDIO proxy with dynamic auth from keychain)
npx github:AEGISnetinc/TS-MCP login  # Authenticate first
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud

# Custom cloud server URL
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud-url https://your-server.example.com/mcp
```

Verify with `claude mcp list`. Restart Claude Code after configuration changes.

**Note:** The cloud proxy reads session tokens from keychain on each request. When your Touchstone API key expires, simply re-run `npx github:AEGISnetinc/TS-MCP login` - no config update needed.

See `docs/rabbit-holes/global-vs-local-mcp-gyrations.md` for troubleshooting configuration issues.

## Known Limitations

- Test Setup names must be provided manually (Touchstone API doesn't support listing)
- See `docs/plans/touchstone-api-upgrade-proposal.md` for proposed API enhancements
