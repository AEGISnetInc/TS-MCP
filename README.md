# TS-MCP: Touchstone MCP Server

MCP server for conversational FHIR testing with [Touchstone](https://touchstone.aegis.net).

## Installation

```bash
npm install -g ts-mcp
```

Or run directly with npx:

```bash
npx ts-mcp
```

## Configuration

Add TS-MCP to your Claude Code MCP configuration file at `~/.claude/mcp.json`.

TS-MCP supports two modes: **local** (default) and **cloud**.

### Local Mode

For individual developers running TS-MCP on their own machine:

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

### Cloud Mode

For teams using a shared TS-MCP server:

```json
{
  "mcpServers": {
    "touchstone": {
      "url": "https://your-ts-mcp-server.example.com/mcp"
    }
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOUCHSTONE_BASE_URL` | `https://touchstone.aegis.net` | Touchstone API URL |
| `TS_MCP_TELEMETRY` | `true` | Enable/disable anonymous usage tracking |
| `TS_MCP_MODE` | `local` | Server mode: `local` or `cloud` |
| `DATABASE_URL` | - | PostgreSQL connection string (cloud mode) |
| `TS_MCP_ENCRYPTION_KEY` | - | 32-byte base64 key for API key encryption (cloud mode) |

## Prerequisites

Before using TS-MCP, you need:

1. **Touchstone Account** - Register at [touchstone.aegis.net](https://touchstone.aegis.net)
2. **Test Setup** - Create a Test Setup in Touchstone UI that points to your FHIR server
3. **Test Setup Name** - Note the exact name of your Test Setup (TS-MCP cannot list available setups)

## End-to-End Workflow

### 1. Configure TS-MCP in Claude Code

Add to `~/.claude/mcp.json` (see Configuration section above for local vs cloud mode).

### 2. Authenticate

**Local mode:**
```bash
npx ts-mcp auth
```

**Cloud mode:**
```bash
npx ts-mcp login
```

You'll be prompted for your Touchstone username and password. The password is entered securely (not echoed to screen). Your credentials are stored securely in your system keychain.

You only need to authenticate once per machine (or when your session expires).

### 3. Run Tests by Test Setup Name

Ask Claude to run your Test Setup by its exact name:

> "Run Touchstone tests using Test Setup 'AEGIS-Patient-CRUD-R4'"

Claude will:
1. Launch the test execution via `launch_test_execution`
2. Poll status via `get_test_status` until complete
3. Retrieve results via `get_test_results`
4. Present a summary of passed/failed tests

### 4. Review and Iterate

Review the test results, fix any conformance issues in your FHIR implementation, and run tests again.

## Usage Examples

**Authenticate (in terminal, before using Claude Code):**
```bash
npx ts-mcp auth    # Local mode
npx ts-mcp login   # Cloud mode
```

**Run tests (in Claude Code):**
> "Run tests using Test Setup 'My-Patient-Tests'"

**Check previous execution:**
> "Check the results for execution 12345"

**Run with auto-polling prompt:**
> "Use the run-tests prompt with testSetupName 'My-Patient-Tests'"

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx ts-mcp auth` | Authenticate for local mode (stores API key in keychain) |
| `npx ts-mcp login [name]` | Authenticate with cloud server |
| `npx ts-mcp logout [name]` | Log out from cloud server |
| `npx ts-mcp status` | Show authentication status (local and cloud) |
| `npx ts-mcp --help` | Show help |
| `npx ts-mcp` | Start MCP server (mode determined by TS_MCP_MODE) |

## MCP Tools

| Tool | Description |
|------|-------------|
| `launch_test_execution` | Start a test run |
| `get_test_status` | Check execution status |
| `get_test_results` | Get detailed results |

## Prompts

| Prompt | Description |
|--------|-------------|
| `run-tests` | Execute tests and auto-poll until complete |
| `check-results` | Check results for a previous execution |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

## Architecture

```
src/
├── index.ts                    # Entry point (CLI routing, mode detection)
├── cli/
│   ├── auth.ts                 # Local authentication command
│   ├── login.ts                # Cloud login command
│   ├── logout.ts               # Cloud logout command
│   └── status.ts               # Auth status command
├── server/
│   ├── mcp-server.ts           # MCP server implementation
│   ├── http-server.ts          # Express server (cloud mode)
│   ├── auth-service.ts         # Login/logout/status service (cloud mode)
│   ├── tools.ts                # Tool definitions
│   └── prompts.ts              # Prompt definitions
├── touchstone/
│   ├── client.ts               # Touchstone API client
│   ├── types.ts                # Zod schemas
│   └── rate-limiter.ts         # Rate limiting
├── auth/
│   ├── auth-provider.ts        # AuthProvider interface
│   ├── local-auth-provider.ts  # Keychain-based auth (local mode)
│   ├── cloud-auth-provider.ts  # Session-based auth (cloud mode)
│   └── keychain.ts             # Secure credential storage
├── db/                         # Database layer (cloud mode)
│   ├── client.ts               # PostgreSQL connection
│   ├── users.ts                # User repository
│   ├── sessions.ts             # Session repository
│   ├── migrate.ts              # Migration runner
│   └── migrations/             # SQL migrations
├── crypto/
│   └── encryption.ts           # AES-256-GCM encryption
├── analytics/
│   ├── posthog-client.ts       # PostHog wrapper
│   └── events.ts               # Event definitions
└── utils/
    ├── config.ts               # Configuration
    ├── errors.ts               # Error types
    └── result-transformer.ts   # Result formatting
```

## License

Proprietary - AEGIS.net, Inc. All rights reserved.
