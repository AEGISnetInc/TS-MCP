# Getting Started with TS-MCP

TS-MCP enables conversational FHIR testing through Claude Code by connecting to the Touchstone API. This guide walks you through setup and usage.

## Choose Your Mode

TS-MCP supports two deployment modes:

| Mode | Description | Best For |
|------|-------------|----------|
| **Local Mode** | Runs on your machine, stores credentials in your system keychain | Individual developers |
| **Cloud Mode** | Proxies to a shared cloud server with dynamic auth from keychain | Teams, shared environments |

Choose the mode that fits your needs and follow the corresponding setup instructions below.

---

## Local Mode Setup

Local mode runs the TS-MCP server on your machine. Your Touchstone API key is stored securely in your system keychain.

### Prerequisites (Local Mode)

- **Node.js 18+** installed
- **Claude Code CLI** installed and configured
- **Touchstone account** with valid credentials
- **Test Setup** already configured in the Touchstone UI

### Step 1: Configure Claude Code (Local Mode)

Add TS-MCP to your Claude Code MCP configuration:

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve
```

Or manually edit your `~/.claude/mcp.json` file:

```json
{
  "mcpServers": {
    "ts-mcp": {
      "command": "npx",
      "args": ["github:AEGISnetinc/TS-MCP", "serve"]
    }
  }
}
```

### Optional: Custom Touchstone URL

If you're using a private Touchstone deployment instead of the public SaaS instance, add the `TOUCHSTONE_BASE_URL` environment variable:

```json
{
  "mcpServers": {
    "ts-mcp": {
      "command": "npx",
      "args": ["github:AEGISnetinc/TS-MCP", "serve"],
      "env": {
        "TOUCHSTONE_BASE_URL": "https://your-touchstone-server.example.com"
      }
    }
  }
}
```

### Optional: Disable Telemetry

TS-MCP collects anonymous usage analytics to improve the product. No personal information, credentials, or test data is ever collected. To opt out:

```json
{
  "mcpServers": {
    "ts-mcp": {
      "command": "npx",
      "args": ["github:AEGISnetinc/TS-MCP", "serve"],
      "env": {
        "TS_MCP_TELEMETRY": "false"
      }
    }
  }
}
```

### Step 2: Authenticate with Touchstone (Local Mode)

Before using TS-MCP in Claude Code, authenticate from your terminal:

```bash
npx github:AEGISnetinc/TS-MCP auth
```

You'll be prompted for your Touchstone username (email) and password:

```
Touchstone Authentication

Username (email): your.email@example.com
Password: ********

Authenticating...
✓ Authenticated successfully. API key stored in keychain.

You can now use TS-MCP tools in Claude Code without re-authenticating.
```

Your API key is securely stored in your system keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service). You won't need to authenticate again unless your session expires.

You're all set for local mode! Skip to [Using TS-MCP in Claude Code](#using-ts-mcp-in-claude-code) below.

---

## Cloud Mode Setup

Cloud mode uses a local proxy that forwards requests to a shared TS-MCP cloud server. The proxy automatically reads your session token from the system keychain on each request, so re-authentication takes effect immediately without any configuration changes.

### Prerequisites (Cloud Mode)

- **Node.js 18+** installed
- **Claude Code CLI** installed and configured
- **Touchstone account** with valid credentials
- **Test Setup** already configured in the Touchstone UI

### Step 1: Authenticate with Cloud Server

First, log in to the cloud server:

```bash
npx github:AEGISnetinc/TS-MCP login
```

You'll be prompted for your Touchstone credentials:

```
TS-MCP Cloud Login

Server: https://ts-mcp.fly.dev

Username (email): your.email@example.com
Password: ********

Authenticating...
✓ Logged in successfully. Session stored in keychain.

Session expires: 2/21/2026

You can now use TS-MCP tools in Claude Code.
```

Your session token is stored securely in your system keychain.

### Step 2: Configure Claude Code (Cloud Mode)

Add TS-MCP in cloud proxy mode:

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud
```

Or manually edit your `~/.claude/mcp.json` file:

```json
{
  "mcpServers": {
    "ts-mcp": {
      "command": "npx",
      "args": ["github:AEGISnetinc/TS-MCP", "serve", "--cloud"]
    }
  }
}
```

Restart Claude Code to load the MCP server.

### Optional: Custom Cloud Server URL

If your organization runs a private TS-MCP cloud server:

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP serve --cloud-url https://your-server.example.com/mcp
```

Or in `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "ts-mcp": {
      "command": "npx",
      "args": ["github:AEGISnetinc/TS-MCP", "serve", "--cloud-url", "https://your-server.example.com/mcp"]
    }
  }
}
```

### Cloud Authentication Commands

#### Login

```bash
npx github:AEGISnetinc/TS-MCP login
```

#### Logout

```bash
npx github:AEGISnetinc/TS-MCP logout
```

#### Check Status

```bash
npx github:AEGISnetinc/TS-MCP status
```

Shows authentication status:

```
TS-MCP Status

Local mode:
  Status: Not authenticated
  Run "ts-mcp auth" to authenticate

Cloud servers:
  https://ts-mcp.fly.dev:
    Status: Authenticated
    Expires: 2/21/2026
```

### Re-authentication After Expiration

When your Touchstone API key expires, the MCP server will return an error with instructions. Simply run:

```bash
npx github:AEGISnetinc/TS-MCP login
```

The proxy automatically picks up the new session token on the next request - no MCP configuration changes needed!

---

## Using TS-MCP in Claude Code

After authentication, restart Claude Code (or start a new session) to load the MCP server. You can now run Touchstone tests through natural conversation.

### Running Tests

Simply ask Claude to run your test setup by name:

```
You: Run the Patient-CRUD test setup

Claude: I'll run the Patient-CRUD test setup for you.

[Launches test execution]
[Polls status until complete]

The test execution has completed. Here are the results:

Summary: 47 passed, 3 failed out of 50 tests

Failures:
1. Patient-read
   - Assertion: Response status code is 200
   - Expected: 200
   - Actual: 404
   - Message: Patient resource not found
...
```

### Checking Previous Results

If you have an execution ID from a previous run:

```
You: Check the results for execution 12345

Claude: [Retrieves and displays the test results]
```

## Available Tools

TS-MCP provides three tools that Claude can use:

| Tool | Description |
|------|-------------|
| `launch_test_execution` | Start a test run using a Test Setup name |
| `get_test_status` | Check if a test execution is still running |
| `get_test_results` | Get detailed results for a completed execution |

Claude orchestrates these tools automatically when you ask it to run tests.

## Example Workflows

### Basic Test Run

```
You: Run my FHIR Patient validation tests
Claude: What's the name of your Test Setup in Touchstone?
You: Patient-CRUD-R4
Claude: Running Patient-CRUD-R4... [shows results when complete]
```

### Investigating Failures

```
You: Run the Observation-create test setup and explain any failures
Claude: [Runs tests, then provides detailed analysis of failures]
```

### Multiple Test Runs

```
You: Run Patient-CRUD first, then run Encounter-workflow
Claude: [Runs both test setups sequentially and summarizes results]
```

## Troubleshooting

### "Not authenticated" Error

**Local mode:** Your session may have expired. Re-authenticate:

```bash
npx github:AEGISnetinc/TS-MCP auth
```

**Cloud mode:** Your session may have expired. Re-login:

```bash
npx github:AEGISnetinc/TS-MCP login
```

The cloud proxy automatically picks up the new token - no config changes needed.

### "Touchstone API key expired" Error

Your Touchstone API key has expired. The error message includes the action to take:

```
Authentication required. Run: npx github:AEGISnetinc/TS-MCP login
```

Simply run the command and the proxy will use your new credentials on the next request.

### "Test Setup not found" Error

Verify the exact Test Setup name in the Touchstone UI. Names are case-sensitive.

### Connection Errors

- Check your network connection
- Verify the Touchstone URL is correct (if using a private deployment)
- Ensure Touchstone is accessible from your machine

**Cloud mode specific:**
- Verify the cloud server is running and accessible
- Check your status: `npx github:AEGISnetinc/TS-MCP status`

### Claude Doesn't See TS-MCP Tools

1. Verify your `~/.claude/mcp.json` configuration is correct
2. Restart Claude Code to reload MCP servers
3. **Local mode:** Check that `npx github:AEGISnetinc/TS-MCP serve` runs without errors
4. **Cloud mode:** Check that `npx github:AEGISnetinc/TS-MCP status` shows you're authenticated

## Security Notes

- **Credentials**: Your username and password are only used during authentication and are never stored
- **API Key (Local Mode)**: Stored securely in your system keychain (encrypted by your OS)
- **Session Token (Cloud Mode)**: Stored securely in your system keychain; sessions expire after a configurable period (default 30 days)
- **Transport**: All communication with Touchstone and cloud servers uses HTTPS
- **Cloud Encryption**: API keys stored on cloud servers are encrypted with AES-256-GCM
- **Telemetry**: No credentials, test data, or personal information is ever collected

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Touchstone credentials work in the Touchstone web UI
3. Ensure your Test Setup is properly configured in Touchstone

## Next Steps

- Configure Test Setups in the Touchstone UI for the test scenarios you want to run
- Explore using Claude to help interpret test failures and suggest fixes
- Integrate test runs into your development workflow
