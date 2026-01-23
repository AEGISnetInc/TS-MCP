import * as readline from 'readline';
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
 * Prompt for input with visible text.
 */
function question(rl, prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}
/**
 * Prompt for password with hidden input (characters shown as asterisks).
 * Uses the same pattern as auth.ts for consistency.
 */
function questionHidden(prompt) {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        const isTTY = stdin.isTTY;
        process.stdout.write(prompt);
        if (isTTY) {
            stdin.setRawMode(true);
        }
        stdin.resume();
        let password = '';
        const onData = (data) => {
            const str = data.toString();
            // Process each character individually (handles paste)
            for (const c of str) {
                switch (c) {
                    case '\n':
                    case '\r':
                    case '\u0004': // Ctrl+D
                        if (isTTY) {
                            stdin.setRawMode(false);
                        }
                        stdin.removeListener('data', onData);
                        stdin.pause();
                        process.stdout.write('\n');
                        resolve(password);
                        return; // Exit handler after submit
                    case '\u0003': // Ctrl+C
                        if (isTTY) {
                            stdin.setRawMode(false);
                        }
                        process.exit(1);
                        return;
                    case '\u007F': // Backspace
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            process.stdout.write('\b \b'); // Erase character
                        }
                        break;
                    default:
                        password += c;
                        process.stdout.write('*'); // Show asterisk for each character
                        break;
                }
            }
        };
        stdin.on('data', onData);
    });
}
/**
 * Run the CLI login flow for cloud authentication.
 * Reads server URL from ~/.claude/mcp.json, prompts for credentials,
 * authenticates with the server, and stores the session token in keychain.
 */
export async function runLoginCli(serverName) {
    console.log('TS-MCP Cloud Login\n');
    // Get server URL from config
    const serverUrl = getServerUrl(serverName);
    if (!serverUrl) {
        console.error('Error: No cloud server configured in ~/.claude/mcp.json');
        console.error('Add a server with a "url" property to your MCP configuration.');
        process.exit(1);
    }
    // Extract base URL (remove /mcp path if present)
    const baseUrl = serverUrl.replace(/\/mcp\/?$/, '');
    console.log(`Server: ${baseUrl}\n`);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        const username = await question(rl, 'Username (email): ');
        rl.close();
        const password = await questionHidden('Password: ');
        if (!username || !password) {
            console.error('Error: Username and password are required.');
            process.exit(1);
        }
        console.log('\nAuthenticating...');
        const response = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }));
            throw new Error(errorData.error || 'Authentication failed');
        }
        const result = await response.json();
        // Store session token in keychain with account name "session:<server-url>"
        const accountName = `session:${baseUrl}`;
        await keytar.setPassword(SERVICE_NAME, accountName, result.sessionToken);
        console.log('Logged in successfully. Session stored in keychain.');
        console.log(`\nSession expires: ${new Date(result.expiresAt).toLocaleDateString()}`);
        console.log('\nYou can now use TS-MCP tools in Claude Code.');
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`\nLogin failed: ${error.message}`);
        }
        else {
            console.error('\nLogin failed: Unknown error');
        }
        process.exit(1);
    }
}
//# sourceMappingURL=login.js.map