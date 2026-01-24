import * as readline from 'readline';

/**
 * Prompt the user with a yes/no question.
 */
async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(question, resolve);
  });
  rl.close();

  return answer.toLowerCase() !== 'n';
}

/**
 * Run the CLI status flow.
 * Shows what credentials are stored locally.
 */
export async function runStatusCli(): Promise<void> {
  const { KeychainService } = await import('../auth/keychain.js');

  const keychain = new KeychainService();

  console.log('TS-MCP Status');
  console.log('');

  const apiKey = await keychain.getApiKey();
  const hasCredentials = await keychain.hasCredentials();

  if (!apiKey) {
    console.log('API Key: Not stored');
    console.log(`Credentials: ${hasCredentials ? 'Stored (for auto-refresh)' : 'Not stored'}`);
    console.log('');

    if (await promptYesNo('Would you like to authenticate now? (Y/n): ')) {
      console.log('');
      const { runAuthCli } = await import('./auth.js');
      await runAuthCli();
    }
    return;
  }

  console.log('API Key: Stored');
  console.log(`Credentials: ${hasCredentials ? 'Stored (for auto-refresh)' : 'Not stored'}`);
  console.log('');
  console.log('Note: API key validity is checked when you run a test.');
  console.log('If expired, it will auto-refresh using stored credentials.');
}
