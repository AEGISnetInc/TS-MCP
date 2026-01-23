# TS-MCP: Touchstone MCP Server

MCP server for conversational FHIR testing with [Touchstone](https://touchstone.aegis.net).

## Installation

Run directly with npx (no installation required):

```bash
npx github:AEGISnetinc/TS-MCP --help
```

## Configuration

Add TS-MCP to your Claude Code MCP configuration using the CLI.

TS-MCP supports two modes: **local** (default) and **cloud**.

### Local Mode

For individual developers running TS-MCP on their own machine:

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve
```

### Cloud Mode

For teams using a shared TS-MCP server. The cloud proxy reads auth from your keychain on each request, so re-authentication takes effect immediately without config changes.

1. **Authenticate first:**
```bash
npx github:AEGISnetinc/TS-MCP login
```

2. **Add the MCP server** in cloud proxy mode:
```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud
```

When your session expires (check with `npx github:AEGISnetinc/TS-MCP status`), simply re-run `npx github:AEGISnetinc/TS-MCP login` - no config update needed.

**Custom cloud server URL:**
```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud-url https://your-server.example.com/mcp
```

### Verification

```bash
claude mcp list
# Should show: ts-mcp: ... - ✓ Connected
```

**Restart Claude Code** after adding the server.

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

Run the appropriate `claude mcp add` command (see Configuration section above).

### 2. Authenticate

**Local mode:**
```bash
npx github:AEGISnetinc/TS-MCP auth
```

**Cloud mode:**
```bash
npx github:AEGISnetinc/TS-MCP login
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
npx github:AEGISnetinc/TS-MCP auth    # Local mode
npx github:AEGISnetinc/TS-MCP login   # Cloud mode
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
| `npx github:AEGISnetinc/TS-MCP serve` | Start local MCP server (recommended) |
| `npx github:AEGISnetinc/TS-MCP serve --cloud` | Start cloud proxy (reads auth from keychain) |
| `npx github:AEGISnetinc/TS-MCP serve --cloud-url URL` | Use custom cloud server |
| `npx github:AEGISnetinc/TS-MCP auth` | Authenticate for local mode |
| `npx github:AEGISnetinc/TS-MCP login` | Authenticate with cloud server |
| `npx github:AEGISnetinc/TS-MCP logout` | Log out from cloud server |
| `npx github:AEGISnetinc/TS-MCP status` | Show authentication status |
| `npx github:AEGISnetinc/TS-MCP --help` | Show help |

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
│   ├── serve.ts                # Serve command (local or cloud proxy)
│   └── status.ts               # Auth status command
├── server/
│   ├── mcp-server.ts           # MCP server implementation
│   ├── proxy-server.ts         # Cloud proxy (STDIO to HTTP with dynamic auth)
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
