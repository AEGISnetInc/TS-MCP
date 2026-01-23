import { decrypt } from '../crypto/encryption.js';
import { NotAuthenticatedError } from '../utils/errors.js';
/**
 * Auth provider for cloud mode - retrieves API key from database session.
 */
export class CloudAuthProvider {
    sessions;
    constructor(sessions) {
        this.sessions = sessions;
    }
    async getApiKey(context) {
        const sessionToken = context?.sessionToken;
        if (!sessionToken) {
            throw new NotAuthenticatedError();
        }
        const session = await this.sessions.findByToken(sessionToken);
        if (!session) {
            throw new NotAuthenticatedError();
        }
        // Update last used timestamp
        await this.sessions.updateLastUsed(sessionToken);
        // Decrypt and return API key
        return decrypt(session.api_key_enc);
    }
    async isAuthenticated(context) {
        const sessionToken = context?.sessionToken;
        if (!sessionToken) {
            return false;
        }
        const session = await this.sessions.findByToken(sessionToken);
        return session !== null;
    }
}
//# sourceMappingURL=cloud-auth-provider.js.map