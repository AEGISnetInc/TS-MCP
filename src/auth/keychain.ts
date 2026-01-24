import keytar from 'keytar';

export const SERVICE_NAME = 'ts-mcp';
export const ACCOUNT_NAME = 'touchstone-api-key';
export const CREDENTIALS_ACCOUNT = 'touchstone-credentials';

export interface StoredCredentials {
  username: string;
  password: string;
}

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

  async getCredentials(): Promise<StoredCredentials | null> {
    const stored = await keytar.getPassword(SERVICE_NAME, CREDENTIALS_ACCOUNT);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as StoredCredentials;
    } catch {
      return null;
    }
  }

  async setCredentials(username: string, password: string): Promise<void> {
    const credentials: StoredCredentials = { username, password };
    await keytar.setPassword(SERVICE_NAME, CREDENTIALS_ACCOUNT, JSON.stringify(credentials));
  }

  async deleteCredentials(): Promise<boolean> {
    return keytar.deletePassword(SERVICE_NAME, CREDENTIALS_ACCOUNT);
  }

  async hasCredentials(): Promise<boolean> {
    const creds = await this.getCredentials();
    return creds !== null;
  }
}
