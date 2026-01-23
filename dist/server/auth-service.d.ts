import { UserRepository } from '../db/users.js';
import { SessionRepository } from '../db/sessions.js';
import { TouchstoneClient } from '../touchstone/client.js';
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
export declare class AuthService {
    private readonly users;
    private readonly sessions;
    private readonly touchstone;
    private readonly sessionTtlDays;
    constructor(users: UserRepository, sessions: SessionRepository, touchstone: TouchstoneClient, sessionTtlDays: number);
    /**
     * Authenticate user with Touchstone and create a session.
     */
    login(username: string, password: string): Promise<LoginResult>;
    /**
     * Invalidate a session.
     */
    logout(sessionToken: string): Promise<boolean>;
    /**
     * Check if a session is valid.
     */
    getSessionStatus(sessionToken: string): Promise<SessionStatus>;
}
//# sourceMappingURL=auth-service.d.ts.map