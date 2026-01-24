export declare const SERVICE_NAME = "ts-mcp";
export declare const ACCOUNT_NAME = "touchstone-api-key";
export declare const CREDENTIALS_ACCOUNT = "touchstone-credentials";
export interface StoredCredentials {
    username: string;
    password: string;
}
export declare class KeychainService {
    getApiKey(): Promise<string | null>;
    setApiKey(apiKey: string): Promise<void>;
    deleteApiKey(): Promise<boolean>;
    hasApiKey(): Promise<boolean>;
    getCredentials(): Promise<StoredCredentials | null>;
    setCredentials(username: string, password: string): Promise<void>;
    deleteCredentials(): Promise<boolean>;
    hasCredentials(): Promise<boolean>;
}
//# sourceMappingURL=keychain.d.ts.map