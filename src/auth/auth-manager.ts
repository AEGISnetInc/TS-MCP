import { KeychainService } from './keychain.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { NotAuthenticatedError } from '../utils/errors.js';

export interface AuthResult {
  success: boolean;
  message: string;
}

export class AuthManager {
  constructor(
    private readonly keychain: KeychainService,
    private readonly client: TouchstoneClient
  ) {}

  async authenticate(username: string, password: string): Promise<AuthResult> {
    const apiKey = await this.client.authenticate(username, password);
    await this.keychain.setApiKey(apiKey);
    return {
      success: true,
      message: 'Successfully authenticated with Touchstone.'
    };
  }

  async getApiKey(): Promise<string> {
    const apiKey = await this.keychain.getApiKey();
    if (!apiKey) {
      throw new NotAuthenticatedError();
    }
    return apiKey;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.keychain.hasApiKey();
  }

  async logout(): Promise<void> {
    await this.keychain.deleteApiKey();
  }
}
