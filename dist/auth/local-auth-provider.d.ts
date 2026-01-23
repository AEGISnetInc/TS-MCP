import { KeychainService } from './keychain.js';
import { AuthProvider, AuthContext } from './auth-provider.js';
/**
 * Auth provider for local mode - retrieves API key from system keychain.
 */
export declare class LocalAuthProvider implements AuthProvider {
    private readonly keychain;
    constructor(keychain: KeychainService);
    getApiKey(_context?: AuthContext): Promise<string>;
    isAuthenticated(_context?: AuthContext): Promise<boolean>;
    /**
     * Removes the API key from the keychain.
     */
    logout(): Promise<void>;
}
//# sourceMappingURL=local-auth-provider.d.ts.map