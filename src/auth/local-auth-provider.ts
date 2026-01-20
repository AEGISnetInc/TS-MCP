import { KeychainService } from './keychain.js';
import { NotAuthenticatedError } from '../utils/errors.js';
import { AuthProvider, AuthContext } from './auth-provider.js';

/**
 * Auth provider for local mode - retrieves API key from system keychain.
 */
export class LocalAuthProvider implements AuthProvider {
  constructor(private readonly keychain: KeychainService) {}

  async getApiKey(_context?: AuthContext): Promise<string> {
    const apiKey = await this.keychain.getApiKey();
    if (!apiKey) {
      throw new NotAuthenticatedError();
    }
    return apiKey;
  }

  async isAuthenticated(_context?: AuthContext): Promise<boolean> {
    return this.keychain.hasApiKey();
  }

  /**
   * Removes the API key from the keychain.
   */
  async logout(): Promise<void> {
    await this.keychain.deleteApiKey();
  }
}
