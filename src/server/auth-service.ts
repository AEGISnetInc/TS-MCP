// src/server/auth-service.ts
import { randomBytes } from 'crypto';
import { UserRepository } from '../db/users.js';
import { SessionRepository } from '../db/sessions.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { encrypt } from '../crypto/encryption.js';

export interface LoginResult {
  sessionToken: string;
  expiresAt: Date;
  userId: string;
  touchstoneUser: string;
}

export interface SessionStatus {
  valid: boolean;
  expiresAt?: Date;
  userId?: string;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly touchstone: TouchstoneClient,
    private readonly sessionTtlDays: number
  ) {}

  /**
   * Authenticate user with Touchstone and create a session.
   */
  async login(username: string, password: string): Promise<LoginResult> {
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
  async logout(sessionToken: string): Promise<boolean> {
    return this.sessions.deleteByToken(sessionToken);
  }

  /**
   * Check if a session is valid.
   */
  async getSessionStatus(sessionToken: string): Promise<SessionStatus> {
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
