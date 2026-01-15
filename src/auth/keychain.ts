import keytar from 'keytar';

export const SERVICE_NAME = 'ts-mcp';
export const ACCOUNT_NAME = 'touchstone-api-key';

export class KeychainService {
  async getApiKey(): Promise<string | null> {
    return keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async setApiKey(apiKey: string): Promise<void> {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
  }

  async deleteApiKey(): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
  }

  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return key !== null;
  }
}
