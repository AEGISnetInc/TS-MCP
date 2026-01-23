# Local-Only Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove cloud mode from TS-MCP, leaving a simplified local-only implementation with PostHog analytics.

**Architecture:** Delete all cloud-related files (server, auth, database, crypto), simplify CLI to just `ts-mcp`, `ts-mcp auth`, and `ts-mcp status`, remove telemetry opt-out, add CI/CD for PostHog key injection.

**Tech Stack:** TypeScript, Node.js, keytar, @modelcontextprotocol/sdk, posthog-node, Jest

---

## Task 1: Delete Cloud Server Files

**Files:**
- Delete: `src/server/proxy-server.ts`
- Delete: `src/server/http-server.ts`
- Delete: `src/server/auth-service.ts`

**Step 1: Delete the files**

```bash
rm src/server/proxy-server.ts
rm src/server/http-server.ts
rm src/server/auth-service.ts
```

**Step 2: Verify files are gone**

```bash
ls src/server/
```

Expected: Only `mcp-server.ts`, `tools.ts`, `prompts.ts` remain

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove cloud server files"
```

---

## Task 2: Delete Cloud CLI Files

**Files:**
- Delete: `src/cli/login.ts`
- Delete: `src/cli/logout.ts`
- Delete: `src/cli/serve.ts`

**Step 1: Delete the files**

```bash
rm src/cli/login.ts
rm src/cli/logout.ts
rm src/cli/serve.ts
```

**Step 2: Verify files are gone**

```bash
ls src/cli/
```

Expected: Only `auth.ts`, `status.ts` remain

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove cloud CLI files"
```

---

## Task 3: Delete Cloud Auth Provider

**Files:**
- Delete: `src/auth/cloud-auth-provider.ts`

**Step 1: Delete the file**

```bash
rm src/auth/cloud-auth-provider.ts
```

**Step 2: Verify file is gone**

```bash
ls src/auth/
```

Expected: `auth-manager.ts`, `auth-provider.ts`, `keychain.ts`, `local-auth-provider.ts` remain

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove cloud auth provider"
```

---

## Task 4: Delete Database Layer

**Files:**
- Delete: `src/db/` (entire directory)

**Step 1: Delete the directory**

```bash
rm -rf src/db/
```

**Step 2: Verify directory is gone**

```bash
ls src/
```

Expected: No `db/` directory

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove database layer"
```

---

## Task 5: Delete Crypto Module

**Files:**
- Delete: `src/crypto/` (entire directory)

**Step 1: Delete the directory**

```bash
rm -rf src/crypto/
```

**Step 2: Verify directory is gone**

```bash
ls src/
```

Expected: No `crypto/` directory

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove crypto module"
```

---

## Task 6: Delete Deployment Files

**Files:**
- Delete: `fly.toml`

**Step 1: Delete the file**

```bash
rm -f fly.toml
```

**Step 2: Verify file is gone**

```bash
ls fly.toml 2>&1 || echo "File deleted"
```

Expected: "File deleted" or "No such file"

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Fly.io deployment config"
```

---

## Task 7: Delete Cloud-Related Tests

**Files:**
- Delete: `tests/unit/proxy-server.test.ts`
- Delete: `tests/unit/cli-serve.test.ts`
- Delete: `tests/unit/cli-login.test.ts`
- Delete: `tests/unit/cli-logout.test.ts`
- Delete: `tests/unit/cloud-auth-provider.test.ts`
- Delete: `tests/unit/db-client.test.ts`
- Delete: `tests/unit/sessions-repository.test.ts`
- Delete: `tests/unit/users-repository.test.ts`
- Delete: `tests/unit/encryption.test.ts`
- Delete: `tests/unit/auth-service.test.ts`
- Delete: `tests/integration/http-server.test.ts`

**Step 1: Delete the test files**

```bash
rm tests/unit/proxy-server.test.ts
rm tests/unit/cli-serve.test.ts
rm tests/unit/cli-login.test.ts
rm tests/unit/cli-logout.test.ts
rm tests/unit/cloud-auth-provider.test.ts
rm tests/unit/db-client.test.ts
rm tests/unit/sessions-repository.test.ts
rm tests/unit/users-repository.test.ts
rm tests/unit/encryption.test.ts
rm tests/unit/auth-service.test.ts
rm tests/integration/http-server.test.ts
```

**Step 2: Verify files are gone**

```bash
ls tests/unit/*.test.ts | wc -l
ls tests/integration/*.test.ts | wc -l
```

Expected: Fewer test files than before

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove cloud-related tests"
```

---

## Task 8: Delete Cloud Documentation

**Files:**
- Delete: `docs/plans/2026-01-19-cloud-deployment-design.md`
- Delete: `docs/plans/2026-01-19-cloud-deployment-implementation.md`
- Delete: `docs/plans/2026-01-22-dynamic-auth-proxy.md`
- Delete: `docs/rabbit-holes/global-vs-local-mcp-gyrations.md`

**Step 1: Delete the files**

```bash
rm docs/plans/2026-01-19-cloud-deployment-design.md
rm docs/plans/2026-01-19-cloud-deployment-implementation.md
rm docs/plans/2026-01-22-dynamic-auth-proxy.md
rm -rf docs/rabbit-holes/
```

**Step 2: Verify files are gone**

```bash
ls docs/plans/
ls docs/
```

Expected: Cloud docs removed, no `rabbit-holes/` directory

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove cloud documentation"
```

---

## Task 9: Update package.json - Remove Cloud Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Read current package.json**

Read `package.json` to see current dependencies.

**Step 2: Remove cloud dependencies**

Remove from `dependencies`:
- `pg`
- `@types/pg` (if in dependencies)
- `express`
- `@types/express` (if in dependencies)

Remove from `devDependencies`:
- `@types/pg`
- `@types/express`

**Step 3: Run npm install to update lockfile**

```bash
npm install
```

**Step 4: Verify dependencies removed**

```bash
grep -E "(pg|express)" package.json || echo "Dependencies removed"
```

Expected: "Dependencies removed"

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove cloud dependencies (pg, express)"
```

---

## Task 10: Update src/utils/config.ts - Remove Cloud Config

**Files:**
- Modify: `src/utils/config.ts`
- Modify: `tests/unit/config.test.ts`

**Step 1: Read current config.ts**

Read `src/utils/config.ts` to understand current structure.

**Step 2: Update config.ts**

Remove:
- `mode` config option
- `TS_MCP_MODE` environment variable handling
- Any cloud-specific config
- `TS_MCP_TELEMETRY` environment variable (no opt-out)

Keep:
- `touchstoneBaseUrl`
- `TOUCHSTONE_BASE_URL` env var

**Step 3: Update config.test.ts**

Remove tests for:
- `mode` config
- `TS_MCP_MODE` env var
- `TS_MCP_TELEMETRY` env var

**Step 4: Run tests**

```bash
npm test -- tests/unit/config.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/utils/config.ts tests/unit/config.test.ts
git commit -m "refactor: simplify config to local-only"
```

---

## Task 11: Update src/utils/errors.ts - Simplify Errors

**Files:**
- Modify: `src/utils/errors.ts`
- Modify: `tests/unit/errors.test.ts`

**Step 1: Read current errors.ts**

Read `src/utils/errors.ts` to see current error types.

**Step 2: Update errors.ts**

- Change `TouchstoneApiKeyExpiredError` action from `login` to `auth`:
  ```typescript
  { action: 'npx github:AEGISnetinc/TS-MCP auth' }
  ```
- Remove `SessionExpiredError` class (was for cloud sessions)

**Step 3: Update errors.test.ts**

- Update test for `TouchstoneApiKeyExpiredError` to expect `auth` action
- Remove tests for `SessionExpiredError`

**Step 4: Run tests**

```bash
npm test -- tests/unit/errors.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/utils/errors.ts tests/unit/errors.test.ts
git commit -m "refactor: simplify errors for local-only"
```

---

## Task 12: Update src/analytics/posthog-client.ts - Remove Opt-Out

**Files:**
- Modify: `src/analytics/posthog-client.ts`
- Modify: `tests/unit/posthog-client.test.ts`

**Step 1: Read current posthog-client.ts**

Read `src/analytics/posthog-client.ts` to see current structure.

**Step 2: Update posthog-client.ts**

Remove:
- `enabled` constructor parameter
- Conditional logic based on `enabled`

Result: Always initialize PostHog if API key is present (not placeholder).

```typescript
export class AnalyticsClient {
  private posthog: PostHog | null = null;
  private instanceId: string;

  constructor() {
    this.instanceId = randomUUID();

    if (POSTHOG_API_KEY !== '__POSTHOG_API_KEY__') {
      this.posthog = new PostHog(POSTHOG_API_KEY, {
        host: 'https://app.posthog.com'
      });
    }
  }
  // ... rest unchanged
}
```

**Step 3: Update posthog-client.test.ts**

Remove tests for `enabled` flag behavior.

**Step 4: Run tests**

```bash
npm test -- tests/unit/posthog-client.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/analytics/posthog-client.ts tests/unit/posthog-client.test.ts
git commit -m "refactor: remove telemetry opt-out"
```

---

## Task 13: Update src/index.ts - Simplify CLI Routing

**Files:**
- Modify: `src/index.ts`
- Modify: `tests/unit/index.test.ts`

**Step 1: Read current index.ts**

Read `src/index.ts` to see current routing.

**Step 2: Update index.ts**

Remove:
- `serve` command and all its options
- `login` command
- `logout` command
- `runCloudServer()` function
- Cloud mode detection

Update `handleCommand`:
- `undefined` (no args) → run local server
- `auth` → run auth CLI
- `status` → run status CLI
- `--help` / `-h` → print help

Update `printHelp`:
```
TS-MCP - Touchstone MCP Server for Claude Code

Usage: ts-mcp [command]

Commands:
  (none)    Start MCP server
  auth      Authenticate with Touchstone
  status    Show authentication status
  --help    Show this help

Example:
  claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP
  npx github:AEGISnetinc/TS-MCP auth
```

**Step 3: Update index.test.ts**

Remove tests for:
- `serve` command
- `login` command
- `logout` command
- Cloud mode detection

Update tests for:
- Simplified help output
- Default behavior (start server)

**Step 4: Run tests**

```bash
npm test -- tests/unit/index.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/index.ts tests/unit/index.test.ts
git commit -m "refactor: simplify CLI to local-only"
```

---

## Task 14: Update src/cli/status.ts - Add Auth Prompt

**Files:**
- Modify: `src/cli/status.ts`
- Modify: `tests/unit/cli-status.test.ts`

**Step 1: Read current status.ts**

Read `src/cli/status.ts` to see current implementation.

**Step 2: Update status.ts**

Remove:
- Cloud server status checks
- Multiple server iteration

Add:
- Prompt to authenticate if not authenticated
- Use readline for Y/n prompt
- If user says yes, call auth flow

```typescript
import * as readline from 'readline';
import { runAuthCli } from './auth.js';

export async function runStatusCli(): Promise<void> {
  const { KeychainService } = await import('../auth/keychain.js');
  const keychain = new KeychainService();
  const hasKey = await keychain.hasApiKey();

  console.log('TS-MCP Status');
  console.log('');

  if (hasKey) {
    console.log('Authenticated: Yes');
  } else {
    console.log('Authenticated: No');
    console.log('');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Would you like to authenticate now? (Y/n): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'n') {
      console.log('');
      await runAuthCli();
    }
  }
}
```

**Step 3: Update cli-status.test.ts**

Remove tests for cloud status. Add tests for:
- Shows "Authenticated: Yes" when key exists
- Shows "Authenticated: No" and prompts when no key
- Mock readline for prompt testing

**Step 4: Run tests**

```bash
npm test -- tests/unit/cli-status.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/cli/status.ts tests/unit/cli-status.test.ts
git commit -m "feat: status command prompts to auth if needed"
```

---

## Task 15: Update src/touchstone/client.ts - Verify Error Type

**Files:**
- Modify: `src/touchstone/client.ts` (if needed)
- Check: `tests/unit/touchstone-client.test.ts`

**Step 1: Read touchstone/client.ts**

Read `src/touchstone/client.ts` to verify it uses `TouchstoneApiKeyExpiredError`.

**Step 2: Verify or update**

The file should already throw `TouchstoneApiKeyExpiredError` on 401. Verify the import is correct and no cloud-specific errors are used.

**Step 3: Run tests**

```bash
npm test -- tests/unit/touchstone-client.test.ts
```

Expected: All tests pass

**Step 4: Commit (if changes made)**

```bash
git add src/touchstone/client.ts
git commit -m "refactor: verify touchstone client uses correct error"
```

---

## Task 16: Run Full Test Suite

**Step 1: Run all tests**

```bash
npm test
```

Expected: All remaining tests pass

**Step 2: Fix any failing tests**

If tests fail, fix them before proceeding.

**Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds with no errors

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve test failures after simplification"
```

---

## Task 17: Rewrite README.md

**Files:**
- Modify: `README.md`

**Step 1: Rewrite README.md**

```markdown
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
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for local-only"
```

---

## Task 18: Rewrite docs/users/getting-started.md

**Files:**
- Modify: `docs/users/getting-started.md`

**Step 1: Rewrite getting-started.md**

```markdown
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
✓ Authenticated successfully. API key stored in credential store.
```

Your API key is stored securely in your system credential store (macOS Keychain, Windows Credential Manager, or Linux Secret Service).

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

## Re-authentication

When your Touchstone API key expires, Claude will notify you and automatically run the authentication command. Enter your credentials and Claude will retry your request.

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

## Security

- **Credentials**: Username and password are only used during authentication, never stored
- **API Key**: Stored securely in your system credential store
- **Transport**: All communication uses HTTPS
```

**Step 2: Commit**

```bash
git add docs/users/getting-started.md
git commit -m "docs: rewrite getting-started for local-only"
```

---

## Task 19: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Read current CLAUDE.md**

Read `CLAUDE.md` to see what needs updating.

**Step 2: Update CLAUDE.md**

Remove:
- Cloud mode references
- HTTP server/transport mentions
- Database/PostgreSQL references
- Cloud auth provider references
- Cloud CLI command references
- Cloud design doc references

Update:
- MCP Configuration section (simple local command)
- Important Files section (remove cloud files)
- Architecture Decisions (remove cloud items)

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for local-only"
```

---

## Task 20: Create CI/CD Workflow for PostHog

**Files:**
- Create: `.github/workflows/build.yml`

**Step 1: Create workflow file**

```yaml
name: Build and Commit

on:
  push:
    branches: [main, Local-Only]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build with PostHog key
        env:
          POSTHOG_API_KEY: ${{ secrets.POSTHOG_API_KEY }}
        run: npm run build

      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet dist/; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit dist changes
        if: steps.changes.outputs.changed == 'true'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add dist/
          git commit -m "chore: rebuild dist with PostHog key [skip ci]"
          git push
```

**Step 2: Commit**

```bash
git add .github/workflows/build.yml
git commit -m "ci: add workflow to build with PostHog key"
```

---

## Task 21: Rebuild dist/ and Final Test

**Step 1: Rebuild dist/**

```bash
npm run build
```

**Step 2: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 3: Test CLI manually**

```bash
node dist/index.js --help
```

Expected: Shows simplified help

**Step 4: Commit rebuilt dist/**

```bash
git add dist/
git commit -m "chore: rebuild dist for local-only"
```

---

## Task 22: Final Review and Push

**Step 1: Review all commits**

```bash
git log --oneline Local-Only ^Local-and-Cloud
```

**Step 2: Run tests one more time**

```bash
npm test
```

Expected: All tests pass

**Step 3: Push to remote**

```bash
git push origin Local-Only
```

---

## Summary

After completing all tasks:

- ~20 files deleted
- CLI simplified to 3 commands
- No cloud dependencies
- PostHog analytics (no opt-out)
- CI/CD rebuilds dist/ with PostHog key
- Simplified documentation

To merge into main later:
```bash
git checkout main
git merge Local-Only
git push origin main
```
