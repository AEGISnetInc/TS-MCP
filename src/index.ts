#!/usr/bin/env node

import { TSMCPServer } from './server/mcp-server.js';
import { LocalAuthProvider } from './auth/local-auth-provider.js';
import { KeychainService } from './auth/keychain.js';
import { runAuthCli } from './cli/auth.js';

async function main() {
  const args = process.argv.slice(2);

  // Handle CLI commands
  if (args[0] === 'auth') {
    await runAuthCli();
    return;
  }

  // Show help for unknown commands
  if (args.length > 0 && args[0] !== '--help' && args[0] !== '-h') {
    console.error(`Unknown command: ${args[0]}`);
    console.error('Usage: ts-mcp [command]');
    console.error('Commands:');
    console.error('  auth    Authenticate with Touchstone (stores API key in keychain)');
    console.error('  (none)  Start the MCP server');
    process.exit(1);
  }

  if (args[0] === '--help' || args[0] === '-h') {
    console.log('TS-MCP - Touchstone MCP Server for Claude Code');
    console.log('');
    console.log('Usage: ts-mcp [command]');
    console.log('');
    console.log('Commands:');
    console.log('  auth    Authenticate with Touchstone (stores API key in keychain)');
    console.log('  (none)  Start the MCP server (used by Claude Code)');
    console.log('');
    console.log('Examples:');
    console.log('  npx ts-mcp auth     # Authenticate before using Claude Code');
    console.log('  npx ts-mcp          # Start server (called by Claude Code)');
    return;
  }

  // Default: run MCP server
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

main().catch((error) => {
  console.error('Failed to start TS-MCP server:', error);
  process.exit(1);
});
