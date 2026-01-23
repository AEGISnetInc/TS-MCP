export declare const SERVICE_NAME = "ts-mcp";
export declare const ACCOUNT_NAME = "touchstone-api-key";
export declare class KeychainService {
    getApiKey(): Promise<string | null>;
    setApiKey(apiKey: string): Promise<void>;
    deleteApiKey(): Promise<boolean>;
    hasApiKey(): Promise<boolean>;
}
//# sourceMappingURL=keychain.d.ts.map