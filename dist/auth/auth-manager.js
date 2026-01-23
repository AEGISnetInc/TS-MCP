import { NotAuthenticatedError } from '../utils/errors.js';
/**
 * Manages API key retrieval from the system keychain.
 * Authentication is handled separately via CLI (`npx ts-mcp auth`).
 */
export class AuthManager {
    keychain;
    constructor(keychain) {
        this.keychain = keychain;
    }
    /**
     * Retrieves the API key from the keychain.
     * @throws NotAuthenticatedError if no API key is stored.
     */
    async getApiKey() {
        const apiKey = await this.keychain.getApiKey();
        if (!apiKey) {
            throw new NotAuthenticatedError();
        }
        return apiKey;
    }
    /**
     * Checks if an API key is stored in the keychain.
     */
    async isAuthenticated() {
        return this.keychain.hasApiKey();
    }
    /**
     * Removes the API key from the keychain.
     */
    async logout() {
        await this.keychain.deleteApiKey();
    }
}
//# sourceMappingURL=auth-manager.js.map