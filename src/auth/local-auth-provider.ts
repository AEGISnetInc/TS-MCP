import { KeychainService } from './keychain.js';
import { NotAuthenticatedError } from '../utils/errors.js';
import { AuthProvider, AuthContext } from './auth-provider.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { getConfig } from '../utils/config.js';

/**
 * Auth provider for local mode - retrieves API key from system keychain.
 * Supports automatic re-authentication when API key expires.
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

  /**
   * Refresh the API key using stored credentials.
   * @returns The new API key, or null if credentials not available.
   */
  async refreshApiKey(): Promise<string | null> {
    const credentials = await this.keychain.getCredentials();
    if (!credentials) {
      return null;
    }

    const config = getConfig();
    const client = new TouchstoneClient(config.touchstoneBaseUrl);

    const newApiKey = await client.authenticate(credentials.username, credentials.password);
    await this.keychain.setApiKey(newApiKey);

    return newApiKey;
  }

  /**
   * Check if credentials are stored for auto-refresh.
   */
  async canAutoRefresh(): Promise<boolean> {
    return this.keychain.hasCredentials();
  }
}
