#!/usr/bin/env node

import { getConfig } from './utils/config.js';

/**
 * Start the MCP server in local mode (STDIO transport).
 * Uses dynamic imports to avoid loading keytar in cloud mode.
 */
export async function runLocalServer(): Promise<void> {
  const { TSMCPServer } = await import('./server/mcp-server.js');
  const { LocalAuthProvider } = await import('./auth/local-auth-provider.js');
  const { KeychainService } = await import('./auth/keychain.js');

  const keychain = new KeychainService();
  const authProvider = new LocalAuthProvider(keychain);
  const server = new TSMCPServer(authProvider);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.shutdown();
    process.exit(0);
  });

  await server.run();
}

/**
 * Start the MCP server in cloud mode (HTTP transport with database).
 */
export async function runCloudServer(): Promise<void> {
  // Dynamic imports to avoid loading DB deps in local mode
  const { createHttpServer } = await import('./server/http-server.js');
  const { DatabaseClient } = await import('./db/client.js');
  const { runMigrations } = await import('./db/migrate.js');
  const { TouchstoneClient } = await import('./touchstone/client.js');

  const config = getConfig();
  const db = new DatabaseClient();

  // Run database migrations
  await runMigrations(db);

  const touchstoneClient = new TouchstoneClient(config.touchstoneBaseUrl);
  const { app, close } = createHttpServer({ db, touchstoneClient });

  const server = app.listen(config.port, () => {
    console.log(`TS-MCP cloud server running on port ${config.port}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await close();
    await db.close();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await close();
    await db.close();
    server.close();
    process.exit(0);
  });
}

/**
 * Print help message.
 */
export function printHelp(): void {
  console.log('TS-MCP - Touchstone MCP Server for Claude Code');
  console.log('');
  console.log('Usage: ts-mcp [command]');
  console.log('');
  console.log('Commands:');
  console.log('  auth           Authenticate for local mode (stores API key in keychain)');
  console.log('  login [name]   Authenticate with cloud server');
  console.log('  logout [name]  Log out from cloud server');
  console.log('  status         Show authentication status');
  console.log('  (none)         Start MCP server (mode determined by TS_MCP_MODE)');
  console.log('');
  console.log('Environment:');
  console.log('  TS_MCP_MODE=local|cloud  Server mode (default: local)');
  console.log('');
  console.log('Examples:');
  console.log('  ts-mcp auth              # Authenticate for local mode');
  console.log('  ts-mcp login             # Authenticate with cloud server');
  console.log('  ts-mcp login touchstone  # Authenticate with specific server');
  console.log('  ts-mcp status            # Show auth status');
}

/**
 * Parse command and route to appropriate handler.
 * Uses dynamic imports to avoid loading keytar in cloud server mode.
 */
export async function handleCommand(args: string[]): Promise<void> {
  const command = args[0];

  switch (command) {
    case 'auth': {
      const { runAuthCli } = await import('./cli/auth.js');
      await runAuthCli();
      break;
    }

    case 'login': {
      const { runLoginCli } = await import('./cli/login.js');
      await runLoginCli(args[1]);
      break;
    }

    case 'logout': {
      const { runLogoutCli } = await import('./cli/logout.js');
      await runLogoutCli(args[1]);
      break;
    }

    case 'status': {
      const { runStatusCli } = await import('./cli/status.js');
      await runStatusCli();
      break;
    }

    case '--help':
    case '-h':
      printHelp();
      break;

    case undefined:
      // No command - run server based on mode
      const config = getConfig();
      if (config.mode === 'cloud') {
        await runCloudServer();
      } else {
        await runLocalServer();
      }
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "ts-mcp --help" for usage.');
      process.exit(1);
  }
}

/**
 * Main entry point.
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  await handleCommand(args);
}

// Only run main() if this is the entry point (not being imported)
// Use a special check that works in ESM
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
