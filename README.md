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

## Usage

### Authentication

First, authenticate with your Touchstone credentials:

> "Authenticate me with Touchstone using my username and password"

Your credentials are used once to obtain an API key, which is stored securely in your system keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service).

### Running Tests

Run a test setup by name:

> "Run my Patient-CRUD tests"

Or use the prompt directly:

> "Use the run-tests prompt with Patient-CRUD"

### Checking Results

Check results for a previous execution:

> "Check the results for execution 12345"

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
