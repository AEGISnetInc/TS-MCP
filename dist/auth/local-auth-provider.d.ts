import { KeychainService } from './keychain.js';
import { AuthProvider, AuthContext } from './auth-provider.js';
/**
 * Auth provider for local mode - retrieves API key from system keychain.
 * Supports automatic re-authentication when API key expires.
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
    /**
     * Refresh the API key using stored credentials.
     * @returns The new API key, or null if credentials not available.
     */
    refreshApiKey(): Promise<string | null>;
    /**
     * Check if credentials are stored for auto-refresh.
     */
    canAutoRefresh(): Promise<boolean>;
}
//# sourceMappingURL=local-auth-provider.d.ts.map