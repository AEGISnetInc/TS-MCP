import * as readline from 'readline';
/**
 * Run the CLI status flow.
 * Shows authentication status and prompts to authenticate if needed.
 */
export async function runStatusCli() {
    const { KeychainService } = await import('../auth/keychain.js');
    const keychain = new KeychainService();
    const hasKey = await keychain.hasApiKey();
    console.log('TS-MCP Status');
    console.log('');
    if (hasKey) {
        console.log('Authenticated: Yes');
    }
    else {
        console.log('Authenticated: No');
        console.log('');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const answer = await new Promise((resolve) => {
            rl.question('Would you like to authenticate now? (Y/n): ', resolve);
        });
        rl.close();
        if (answer.toLowerCase() !== 'n') {
            console.log('');
            const { runAuthCli } = await import('./auth.js');
            await runAuthCli();
        }
    }
}
//# sourceMappingURL=status.js.map