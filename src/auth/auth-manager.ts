import { KeychainService } from './keychain.js';
import { NotAuthenticatedError } from '../utils/errors.js';

/**
 * Manages API key retrieval from the system keychain.
 * Authentication is handled separately via CLI (`npx ts-mcp auth`).
 */
export class AuthManager {
  constructor(private readonly keychain: KeychainService) {}

  /**
   * Retrieves the API key from the keychain.
   * @throws NotAuthenticatedError if no API key is stored.
   */
  async getApiKey(): Promise<string> {
    const apiKey = await this.keychain.getApiKey();
    if (!apiKey) {
      throw new NotAuthenticatedError();
    }
    return apiKey;
  }

  /**
   * Checks if an API key is stored in the keychain.
   */
  async isAuthenticated(): Promise<boolean> {
    return this.keychain.hasApiKey();
  }

  /**
   * Removes the API key from the keychain.
   */
  async logout(): Promise<void> {
    await this.keychain.deleteApiKey();
  }
}
