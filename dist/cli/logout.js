import keytar from 'keytar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const SERVICE_NAME = 'ts-mcp';
/**
 * Read the server URL from ~/.claude/mcp.json
 * If serverName is provided, looks for that specific server.
 * Otherwise, finds the first server with a URL (cloud mode).
 */
function getServerUrl(serverName) {
    const configPath = join(homedir(), '.claude', 'mcp.json');
    if (!existsSync(configPath)) {
        return null;
    }
    try {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));
        if (!config.mcpServers) {
            return null;
        }
        // If server name provided, look for that specific one
        if (serverName) {
            const server = config.mcpServers[serverName];
            return server?.url ?? null;
        }
        // Otherwise, find first server with a URL (cloud mode)
        for (const server of Object.values(config.mcpServers)) {
            if (server.url) {
                return server.url;
            }
        }
        return null;
    }
    catch {
        return null;
    }
}
/**
 * Run the CLI logout flow for cloud authentication.
 * Reads server URL from ~/.claude/mcp.json, retrieves session token from keychain,
 * calls the logout endpoint, and deletes the session token from keychain.
 */
export async function runLogoutCli(serverName) {
    console.log('TS-MCP Cloud Logout\n');
    // Get server URL from config
    const serverUrl = getServerUrl(serverName);
    if (!serverUrl) {
        console.error('Error: No cloud server configured in ~/.claude/mcp.json');
        process.exit(1);
    }
    // Extract base URL (remove /mcp path if present)
    const baseUrl = serverUrl.replace(/\/mcp\/?$/, '');
    const accountName = `session:${baseUrl}`;
    // Get session token from keychain
    const sessionToken = await keytar.getPassword(SERVICE_NAME, accountName);
    if (!sessionToken) {
        console.log('Not logged in to this server.');
        return;
    }
    try {
        // Call logout endpoint on server
        await fetch(`${baseUrl}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
    }
    catch {
        // Ignore network errors - we'll delete local token anyway
        // Server session will eventually expire
    }
    // Delete session token from keychain
    await keytar.deletePassword(SERVICE_NAME, accountName);
    console.log(`Logged out from ${baseUrl}`);
}
//# sourceMappingURL=logout.js.map