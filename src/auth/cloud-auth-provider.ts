// src/auth/cloud-auth-provider.ts
import { AuthProvider, AuthContext } from './auth-provider.js';
import { SessionRepository } from '../db/sessions.js';
import { decrypt } from '../crypto/encryption.js';
import { NotAuthenticatedError } from '../utils/errors.js';

/**
 * Auth provider for cloud mode - retrieves API key from database session.
 */
export class CloudAuthProvider implements AuthProvider {
  constructor(private readonly sessions: SessionRepository) {}

  async getApiKey(context?: AuthContext): Promise<string> {
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

  async isAuthenticated(context?: AuthContext): Promise<boolean> {
    const sessionToken = context?.sessionToken;
    if (!sessionToken) {
      return false;
    }

    const session = await this.sessions.findByToken(sessionToken);
    return session !== null;
  }
}
