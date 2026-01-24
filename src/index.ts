#!/usr/bin/env node

import { realpathSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Start the MCP server (STDIO transport).
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

  // Log to stderr since stdout is used for MCP protocol
  console.error('TS-MCP server running (STDIO mode). Press Ctrl+C to exit.');
  console.error('This server is designed to be launched by Claude Code, not run directly.');

  await server.run();
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
  console.log('  (none)    Start MCP server');
  console.log('  auth      Authenticate with Touchstone');
  console.log('  status    Show authentication status');
  console.log('  --help    Show this help');
  console.log('');
  console.log('Example:');
  console.log('  claude mcp add ts-mcp -- npx github:AEGISnetinc/TS-MCP');
  console.log('  npx github:AEGISnetinc/TS-MCP auth');
}

/**
 * Parse command and route to appropriate handler.
 */
export async function handleCommand(args: string[]): Promise<void> {
  const command = args[0];

  switch (command) {
    case 'auth': {
      const { runAuthCli } = await import('./cli/auth.js');
      await runAuthCli();
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
      // No command - run local server
      await runLocalServer();
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
// Resolve symlinks to handle globally linked packages
const currentFile = fileURLToPath(import.meta.url);
const entryFile = realpathSync(process.argv[1]);
const isMainModule = currentFile === entryFile;
if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
