import * as readline from 'readline';
import { TouchstoneClient } from '../touchstone/client.js';
import { KeychainService } from '../auth/keychain.js';
import { getConfig } from '../utils/config.js';
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
 * Prompt for password with hidden input (characters not echoed).
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
 * Run the CLI authentication flow.
 * Prompts for username and password, authenticates with Touchstone,
 * and stores the API key in the system keychain.
 */
export async function runAuthCli() {
    console.log('Touchstone Authentication\n');
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
        const config = getConfig();
        const client = new TouchstoneClient(config.touchstoneBaseUrl);
        const apiKey = await client.authenticate(username, password);
        const keychain = new KeychainService();
        await keychain.setApiKey(apiKey);
        console.log('✓ Authenticated successfully. API key stored in keychain.');
        console.log('\nYou can now use TS-MCP tools in Claude Code without re-authenticating.');
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`\nAuthentication failed: ${error.message}`);
        }
        else {
            console.error('\nAuthentication failed: Unknown error');
        }
        process.exit(1);
    }
}
//# sourceMappingURL=auth.js.map