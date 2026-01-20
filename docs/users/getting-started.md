# Getting Started with TS-MCP

TS-MCP enables conversational FHIR testing through Claude Code by connecting to the Touchstone API. This guide walks you through setup and usage.

## Choose Your Mode

TS-MCP supports two deployment modes:

| Mode | Description | Best For |
|------|-------------|----------|
| **Local Mode** | Runs on your machine, stores credentials in your system keychain | Individual developers |
| **Cloud Mode** | Connects to a shared cloud server, no local installation required | Teams, shared environments |

Choose the mode that fits your needs and follow the corresponding setup instructions below.

---

## Local Mode Setup

Local mode runs the TS-MCP server on your machine. Your Touchstone API key is stored securely in your system keychain.

### Prerequisites (Local Mode)

- **Node.js 18+** installed
- **Claude Code CLI** installed and configured
- **Touchstone account** with valid credentials
- **Test Setup** already configured in the Touchstone UI

### Step 1: Install TS-MCP

Install the package globally:

```bash
npm install -g ts-mcp
```

Or use it directly via npx (no installation required):

```bash
npx ts-mcp --help
```

### Step 2: Configure Claude Code (Local Mode)

Add TS-MCP to your Claude Code MCP configuration. Edit your `~/.claude/mcp.json` file:

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

### Optional: Custom Touchstone URL

If you're using a private Touchstone deployment instead of the public SaaS instance, add the `TOUCHSTONE_BASE_URL` environment variable:

```json
{
  "mcpServers": {
    "touchstone": {
      "command": "npx",
      "args": ["ts-mcp"],
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
    "touchstone": {
      "command": "npx",
      "args": ["ts-mcp"],
      "env": {
        "TS_MCP_TELEMETRY": "false"
      }
    }
  }
}
```

### Step 3: Authenticate with Touchstone (Local Mode)

Before using TS-MCP in Claude Code, authenticate from your terminal:

```bash
npx ts-mcp auth
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

Cloud mode connects to a shared TS-MCP server. This is ideal for teams or environments where you don't want to run the server locally. You only need the TS-MCP CLI for authentication - the server runs in the cloud.

### Prerequisites (Cloud Mode)

- **Claude Code CLI** installed and configured
- **Touchstone account** with valid credentials
- **Test Setup** already configured in the Touchstone UI
- **Cloud server URL** provided by your administrator

Note: Node.js is only required if you want to use the CLI authentication commands. If your organization provides an alternative authentication method, you may not need to install anything locally.

### Step 1: Configure Claude Code (Cloud Mode)

Edit your `~/.claude/mcp.json` file to point to your cloud server:

```json
{
  "mcpServers": {
    "touchstone": {
      "url": "https://your-ts-mcp-server.example.com/mcp"
    }
  }
}
```

Replace `https://your-ts-mcp-server.example.com` with the URL provided by your administrator.

**Important:** Cloud mode uses a `url` property instead of `command` and `args`. This tells Claude Code to connect to the remote server rather than running a local process.

### Step 2: Authenticate with Cloud Server

Install the TS-MCP CLI (if not already installed):

```bash
npm install -g ts-mcp
```

Then log in to the cloud server:

```bash
ts-mcp login
```

You'll be prompted for your Touchstone credentials:

```
TS-MCP Cloud Login

Server: https://your-ts-mcp-server.example.com

Username (email): your.email@example.com
Password: ********

Authenticating...
✓ Logged in successfully. Session stored in keychain.

Session expires: 2/19/2026

You can now use TS-MCP tools in Claude Code.
```

Your session token is stored securely in your system keychain. The session typically lasts 30 days.

### Cloud Authentication Commands

The TS-MCP CLI provides several commands for managing your cloud session:

#### Login

```bash
ts-mcp login              # Login to the first configured cloud server
ts-mcp login touchstone   # Login to a specific server by name
```

#### Logout

```bash
ts-mcp logout             # Logout from the first configured cloud server
ts-mcp logout touchstone  # Logout from a specific server by name
```

#### Check Status

```bash
ts-mcp status
```

Shows authentication status for both local and cloud modes:

```
TS-MCP Status

Local mode:
  Status: Not authenticated
  Run "ts-mcp auth" to authenticate

Cloud servers:
  touchstone:
    URL: https://your-ts-mcp-server.example.com
    Status: Authenticated
    Expires: 2/19/2026
```

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
npx ts-mcp auth
```

**Cloud mode:** Your session may have expired or been invalidated. Check your status and re-login:

```bash
ts-mcp status
ts-mcp login
```

### "Test Setup not found" Error

Verify the exact Test Setup name in the Touchstone UI. Names are case-sensitive.

### Connection Errors

- Check your network connection
- Verify the Touchstone URL is correct (if using a private deployment)
- Ensure Touchstone is accessible from your machine

**Cloud mode specific:**
- Verify the cloud server URL in your `~/.claude/mcp.json` is correct
- Check that the cloud server is running and accessible
- Ensure the `/mcp` path is included in the URL

### Claude Doesn't See TS-MCP Tools

1. Verify your `~/.claude/mcp.json` configuration is correct
2. Restart Claude Code to reload MCP servers
3. **Local mode:** Check that `npx ts-mcp` runs without errors
4. **Cloud mode:** Check that `ts-mcp status` shows you're authenticated

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
