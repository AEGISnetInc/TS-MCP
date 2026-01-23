// src/server/auth-service.ts
import { randomBytes } from 'crypto';
import { encrypt } from '../crypto/encryption.js';
export class AuthService {
    users;
    sessions;
    touchstone;
    sessionTtlDays;
    constructor(users, sessions, touchstone, sessionTtlDays) {
        this.users = users;
        this.sessions = sessions;
        this.touchstone = touchstone;
        this.sessionTtlDays = sessionTtlDays;
    }
    /**
     * Authenticate user with Touchstone and create a session.
     */
    async login(username, password) {
        // Authenticate with Touchstone
        const apiKey = await this.touchstone.authenticate(username, password);
        // Find or create user
        const user = await this.users.findOrCreate(username);
        // Generate session token
        const sessionToken = randomBytes(32).toString('hex');
        // Encrypt API key
        const apiKeyEncrypted = encrypt(apiKey);
        // Create session
        const session = await this.sessions.create({
            userId: user.id,
            sessionToken,
            apiKeyEncrypted,
            ttlDays: this.sessionTtlDays
        });
        // Update last login
        await this.users.updateLastLogin(user.id);
        return {
            sessionToken: session.session_token,
            expiresAt: session.expires_at,
            userId: user.id,
            touchstoneUser: user.touchstone_user
        };
    }
    /**
     * Invalidate a session.
     */
    async logout(sessionToken) {
        return this.sessions.deleteByToken(sessionToken);
    }
    /**
     * Check if a session is valid.
     */
    async getSessionStatus(sessionToken) {
        const session = await this.sessions.findByToken(sessionToken);
        if (!session) {
            return { valid: false };
        }
        return {
            valid: true,
            expiresAt: session.expires_at,
            userId: session.user_id
        };
    }
}
//# sourceMappingURL=auth-service.js.map