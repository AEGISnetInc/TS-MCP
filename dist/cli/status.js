import * as readline from 'readline';
/**
 * Prompt the user with a yes/no question.
 */
async function promptYesNo(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const answer = await new Promise((resolve) => {
        rl.question(question, resolve);
    });
    rl.close();
    return answer.toLowerCase() !== 'n';
}
/**
 * Run the CLI status flow.
 * Shows authentication status and validates API key with Touchstone.
 */
export async function runStatusCli() {
    const { KeychainService } = await import('../auth/keychain.js');
    const { TouchstoneClient } = await import('../touchstone/client.js');
    const { LocalAuthProvider } = await import('../auth/local-auth-provider.js');
    const { getConfig } = await import('../utils/config.js');
    const { TouchstoneApiKeyExpiredError } = await import('../utils/errors.js');
    const keychain = new KeychainService();
    const config = getConfig();
    console.log('TS-MCP Status');
    console.log('');
    const apiKey = await keychain.getApiKey();
    if (!apiKey) {
        console.log('Authenticated: No');
        console.log('');
        if (await promptYesNo('Would you like to authenticate now? (Y/n): ')) {
            console.log('');
            const { runAuthCli } = await import('./auth.js');
            await runAuthCli();
        }
        return;
    }
    // Validate the API key with Touchstone
    console.log('Validating API key...');
    const client = new TouchstoneClient(config.touchstoneBaseUrl);
    try {
        await client.validateApiKey(apiKey);
        console.log('Authenticated: Yes');
        console.log('API Key: Valid');
    }
    catch (error) {
        if (error instanceof TouchstoneApiKeyExpiredError) {
            console.log('Authenticated: Yes (credentials stored)');
            console.log('API Key: Expired');
            console.log('');
            // Try auto-refresh
            const authProvider = new LocalAuthProvider(keychain);
            if (await authProvider.canAutoRefresh()) {
                console.log('Refreshing API key...');
                try {
                    await authProvider.refreshApiKey();
                    console.log('✓ API key refreshed successfully.');
                }
                catch {
                    console.log('✗ Auto-refresh failed.');
                    console.log('');
                    if (await promptYesNo('Would you like to re-authenticate? (Y/n): ')) {
                        console.log('');
                        const { runAuthCli } = await import('./auth.js');
                        await runAuthCli();
                    }
                }
            }
            else {
                console.log('No stored credentials for auto-refresh.');
                console.log('');
                if (await promptYesNo('Would you like to re-authenticate? (Y/n): ')) {
                    console.log('');
                    const { runAuthCli } = await import('./auth.js');
                    await runAuthCli();
                }
            }
        }
        else {
            console.log('Authenticated: Unknown');
            console.log(`Error validating API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
//# sourceMappingURL=status.js.map