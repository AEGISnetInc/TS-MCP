import { NotAuthenticatedError } from '../utils/errors.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { getConfig } from '../utils/config.js';
/**
 * Auth provider for local mode - retrieves API key from system keychain.
 * Supports automatic re-authentication when API key expires.
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
    /**
     * Refresh the API key using stored credentials.
     * @returns The new API key, or null if credentials not available.
     */
    async refreshApiKey() {
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
    async canAutoRefresh() {
        return this.keychain.hasCredentials();
    }
}
//# sourceMappingURL=local-auth-provider.js.map