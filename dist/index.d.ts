#!/usr/bin/env node
/**
 * Start the MCP server in local mode (STDIO transport).
 * Uses dynamic imports to avoid loading keytar in cloud mode.
 */
export declare function runLocalServer(): Promise<void>;
/**
 * Start the MCP server in cloud mode (HTTP transport with database).
 */
export declare function runCloudServer(): Promise<void>;
/**
 * Print help message.
 */
export declare function printHelp(): void;
/**
 * Parse command and route to appropriate handler.
 * Uses dynamic imports to avoid loading keytar in cloud server mode.
 */
export declare function handleCommand(args: string[]): Promise<void>;
/**
 * Main entry point.
 */
export declare function main(): Promise<void>;
//# sourceMappingURL=index.d.ts.map