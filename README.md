# TS-MCP: Touchstone MCP Server

MCP server for conversational FHIR testing with [Touchstone](https://touchstone.aegis.net).

## Quick Start

1. **Add to Claude Code:**
   ```bash
   claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP
   ```

2. **Authenticate:**
   ```bash
   npx github:AEGISnetinc/TS-MCP auth
   ```

3. **Use in Claude Code:**
   > "Run the Patient-CRUD test setup"

## CLI Commands

| Command | Description |
|---------|-------------|
| `npx github:AEGISnetinc/TS-MCP` | Start MCP server |
| `npx github:AEGISnetinc/TS-MCP auth` | Authenticate with Touchstone |
| `npx github:AEGISnetinc/TS-MCP status` | Show authentication status |
| `npx github:AEGISnetinc/TS-MCP --help` | Show help |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TOUCHSTONE_BASE_URL` | `https://touchstone.aegis.net` | Touchstone API URL |

## Prerequisites

- **Node.js 18+**
- **Claude Code CLI**
- **Touchstone account** with Test Setup configured

## MCP Tools

| Tool | Description |
|------|-------------|
| `launch_test_execution` | Start a test run |
| `get_test_status` | Check execution status |
| `get_test_results` | Get detailed results |

## Updating

TS-MCP is actively developed. To get the latest version:

```bash
npx github:AEGISnetInc/TS-MCP@latest --help
```

Or clear the npx cache and reinstall:

```bash
npm cache clean --force
npx github:AEGISnetInc/TS-MCP auth
```

## Documentation

See [Getting Started Guide](docs/users/getting-started.md) for detailed instructions.

## Development

```bash
npm install     # Install dependencies
npm run build   # Build TypeScript
npm test        # Run tests
```

## License

Proprietary - AEGIS.net, Inc. All rights reserved.
