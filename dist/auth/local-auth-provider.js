import { NotAuthenticatedError } from '../utils/errors.js';
/**
 * Auth provider for local mode - retrieves API key from system keychain.
 */
export class LocalAuthProvider {
    keychain;
    constructor(keychain) {
        this.keychain = keychain;
    }
    async getApiKey(_context) {
        const apiKey = await this.keychain.getApiKey();
        if (!apiKey) {
            throw new NotAuthenticatedError();
        }
        return apiKey;
    }
    async isAuthenticated(_context) {
        return this.keychain.hasApiKey();
    }
    /**
     * Removes the API key from the keychain.
     */
    async logout() {
        await this.keychain.deleteApiKey();
    }
}
//# sourceMappingURL=local-auth-provider.js.map