import keytar from 'keytar';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const SERVICE_NAME = 'ts-mcp';
/**
 * Read and parse the MCP config from ~/.claude/mcp.json
 */
function getMcpConfig() {
    const configPath = join(homedir(), '.claude', 'mcp.json');
    if (!existsSync(configPath)) {
        return null;
    }
    try {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
    catch {
        return null;
    }
}
/**
 * Run the CLI status flow.
 * Shows authentication status for both local mode and cloud servers.
 */
export async function runStatusCli() {
    console.log('TS-MCP Status\n');
    // Check local mode status
    const localApiKey = await keytar.getPassword(SERVICE_NAME, 'touchstone-api-key');
    console.log('Local mode:');
    if (localApiKey) {
        console.log('  Status: Authenticated');
        console.log('  API key stored in keychain');
    }
    else {
        console.log('  Status: Not authenticated');
        console.log('  Run "ts-mcp auth" to authenticate');
    }
    console.log('');
    // Check cloud servers status
    const config = getMcpConfig();
    if (!config?.mcpServers) {
        console.log('Cloud servers: None configured');
        return;
    }
    // Filter to only servers with URLs (cloud mode)
    const cloudServers = Object.entries(config.mcpServers)
        .filter(([_, server]) => server.url);
    if (cloudServers.length === 0) {
        console.log('Cloud servers: None configured');
        return;
    }
    console.log('Cloud servers:');
    for (const [name, server] of cloudServers) {
        // Extract base URL (remove /mcp path if present)
        const baseUrl = server.url.replace(/\/mcp\/?$/, '');
        const accountName = `session:${baseUrl}`;
        console.log(`  ${name}:`);
        console.log(`    URL: ${baseUrl}`);
        // Get session token from keychain
        const sessionToken = await keytar.getPassword(SERVICE_NAME, accountName);
        if (!sessionToken) {
            console.log('    Status: Not authenticated');
            console.log(`    Run "ts-mcp login ${name}" to authenticate`);
            continue;
        }
        // Check session status with server
        try {
            const response = await fetch(`${baseUrl}/auth/status`, {
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
            if (response.ok) {
                const status = await response.json();
                if (status.valid) {
                    console.log('    Status: Authenticated');
                    if (status.user) {
                        console.log(`    User: ${status.user}`);
                    }
                    if (status.expiresAt) {
                        console.log(`    Expires: ${new Date(status.expiresAt).toLocaleDateString()}`);
                    }
                }
                else {
                    console.log('    Status: Session expired');
                    console.log(`    Run "ts-mcp login ${name}" to re-authenticate`);
                }
            }
            else {
                console.log('    Status: Session invalid');
            }
        }
        catch {
            console.log('    Status: Cannot reach server');
        }
    }
}
//# sourceMappingURL=status.js.map