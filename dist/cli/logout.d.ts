/**
 * Run the CLI logout flow for cloud authentication.
 * Reads server URL from ~/.claude/mcp.json, retrieves session token from keychain,
 * calls the logout endpoint, and deletes the session token from keychain.
 */
export declare function runLogoutCli(serverName?: string): Promise<void>;
//# sourceMappingURL=logout.d.ts.map