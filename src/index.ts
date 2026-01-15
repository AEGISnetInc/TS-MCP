#!/usr/bin/env node

import { TSMCPServer } from './server/mcp-server.js';

async function main() {
  const server = new TSMCPServer();

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
