/**
 * Context passed to auth provider for request-scoped authentication.
 */
export interface AuthContext {
    sessionToken?: string;
}
/**
 * Interface for authentication providers.
 * Implementations handle different auth strategies (local keychain, cloud sessions).
 */
export interface AuthProvider {
    /**
     * Retrieves the Touchstone API key for the current context.
     * @throws NotAuthenticatedError if not authenticated.
     */
    getApiKey(context?: AuthContext): Promise<string>;
    /**
     * Checks if the current context is authenticated.
     */
    isAuthenticated(context?: AuthContext): Promise<boolean>;
}
//# sourceMappingURL=auth-provider.d.ts.map