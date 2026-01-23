import { KeychainService } from './keychain.js';
/**
 * Manages API key retrieval from the system keychain.
 * Authentication is handled separately via CLI (`npx ts-mcp auth`).
 */
export declare class AuthManager {
    private readonly keychain;
    constructor(keychain: KeychainService);
    /**
     * Retrieves the API key from the keychain.
     * @throws NotAuthenticatedError if no API key is stored.
     */
    getApiKey(): Promise<string>;
    /**
     * Checks if an API key is stored in the keychain.
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Removes the API key from the keychain.
     */
    logout(): Promise<void>;
}
//# sourceMappingURL=auth-manager.d.ts.map