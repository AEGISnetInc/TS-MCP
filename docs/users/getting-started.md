# Getting Started with TS-MCP

TS-MCP enables conversational FHIR testing through Claude Code by connecting to the Touchstone API.

## Prerequisites

- **Node.js 18+** installed
- **Claude Code CLI** installed and configured
- **Touchstone account** with valid credentials
- **Test Setup** configured in the Touchstone UI

## Step 1: Add TS-MCP to Claude Code

```bash
claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP
```

Restart Claude Code after adding the server.

## Step 2: Authenticate

```bash
npx github:AEGISnetinc/TS-MCP auth
```

You'll be prompted for your Touchstone username and password:

```
Touchstone Authentication

Username (email): your.email@example.com
Password: ********

Authenticating...
✓ Authenticated successfully. API key stored in keychain.

Credentials stored for automatic re-authentication when API key expires.
```

Your API key and credentials are stored securely in your system credential store (macOS Keychain, Windows Credential Manager, or Linux Secret Service).

## Step 3: Use in Claude Code

Ask Claude to run your test setup by name:

```
You: Run the Patient-CRUD test setup

Claude: I'll run the Patient-CRUD test setup for you.

[Launches test execution]
[Polls status until complete]

The test execution has completed. Here are the results:

Summary: 47 passed, 3 failed out of 50 tests
...
```

## Checking Status

To check if you're authenticated:

```bash
npx github:AEGISnetinc/TS-MCP status
```

If you're not authenticated, you'll be prompted to authenticate.

## Automatic Re-authentication

Touchstone API keys expire periodically. TS-MCP handles this automatically:

1. When an API key expires, TS-MCP detects the 401 response
2. Using your stored credentials, it re-authenticates with Touchstone
3. The new API key is saved and the original request is retried

**You won't be interrupted** - the refresh happens transparently. This only works after you've run `auth` at least once to store your credentials.

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

## Troubleshooting

### "Not authenticated" Error

Run the auth command:

```bash
npx github:AEGISnetinc/TS-MCP auth
```

### "Test Setup not found" Error

Verify the exact Test Setup name in the Touchstone UI. Names are case-sensitive.

### Claude Doesn't See TS-MCP Tools

1. Verify configuration: `claude mcp list`
2. Restart Claude Code
3. Check that `npx github:AEGISnetinc/TS-MCP` runs without errors

## Updating TS-MCP

TS-MCP is actively developed with new features released regularly. To get the latest version:

```bash
npx github:AEGISnetInc/TS-MCP@latest --help
```

Or clear the cache and reinstall:

```bash
npm cache clean --force
npx github:AEGISnetInc/TS-MCP auth
```

Your stored credentials will continue to work after updating.

## Security

- **Credentials**: Stored securely in your system credential store for automatic re-authentication
- **API Key**: Stored securely in your system credential store
- **Transport**: All communication uses HTTPS
- **Credential Store**: macOS Keychain, Windows Credential Manager, or Linux Secret Service
