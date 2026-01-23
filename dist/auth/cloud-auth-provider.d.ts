import { AuthProvider, AuthContext } from './auth-provider.js';
import { SessionRepository } from '../db/sessions.js';
/**
 * Auth provider for cloud mode - retrieves API key from database session.
 */
export declare class CloudAuthProvider implements AuthProvider {
    private readonly sessions;
    constructor(sessions: SessionRepository);
    getApiKey(context?: AuthContext): Promise<string>;
    isAuthenticated(context?: AuthContext): Promise<boolean>;
}
//# sourceMappingURL=cloud-auth-provider.d.ts.map