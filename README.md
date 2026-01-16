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

Add to your Claude Code CLI MCP configuration (`~/.claude/mcp.json`):

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

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOUCHSTONE_BASE_URL` | `https://touchstone.aegis.net` | Touchstone API URL |
| `TS_MCP_TELEMETRY` | `true` | Enable/disable anonymous usage tracking |

## Prerequisites

Before using TS-MCP, you need:

1. **Touchstone Account** - Register at [touchstone.aegis.net](https://touchstone.aegis.net)
2. **Test Setup** - Create a Test Setup in Touchstone UI that points to your FHIR server
3. **Test Setup Name** - Note the exact name of your Test Setup (TS-MCP cannot list available setups)

## End-to-End Workflow

### 1. Configure TS-MCP in Claude Code

Add to `~/.claude/mcp.json` (see Configuration section above).

### 2. Authenticate with Touchstone

In Claude Code, say:

> "Authenticate me with Touchstone using username 'myuser' and password 'mypass'"

Your credentials are exchanged for an API key, which is stored securely in your system keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service). You only need to authenticate once per machine.

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

**Authenticate:**
> "Authenticate me with Touchstone"

**Run tests:**
> "Run tests using Test Setup 'My-Patient-Tests'"

**Check previous execution:**
> "Check the results for execution 12345"

**Run with auto-polling prompt:**
> "Use the run-tests prompt with testSetupName 'My-Patient-Tests'"

## Tools

| Tool | Description |
|------|-------------|
| `authenticate` | Authenticate with Touchstone |
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
├── index.ts                 # Entry point
├── server/
│   ├── mcp-server.ts        # MCP server implementation
│   ├── tools.ts             # Tool definitions
│   └── prompts.ts           # Prompt definitions
├── touchstone/
│   ├── client.ts            # Touchstone API client
│   ├── types.ts             # Zod schemas
│   └── rate-limiter.ts      # Rate limiting
├── auth/
│   ├── auth-manager.ts      # Auth coordination
│   └── keychain.ts          # Secure credential storage
├── analytics/
│   ├── posthog-client.ts    # PostHog wrapper
│   └── events.ts            # Event definitions
└── utils/
    ├── config.ts            # Configuration
    ├── errors.ts            # Error types
    └── result-transformer.ts # Result formatting
```

## License

Proprietary - AEGIS.net, Inc. All rights reserved.
