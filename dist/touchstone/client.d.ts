import type { ExecutionStatusResponse, ExecutionDetailResponse, ScriptExecDetailResponse } from './types.js';
export declare class TouchstoneClient {
    private readonly baseUrl;
    constructor(baseUrl: string);
    private request;
    private handleErrorResponse;
    /**
     * Validate an API key by making a lightweight authenticated request.
     * Throws TouchstoneApiKeyExpiredError if the key is invalid/expired.
     */
    validateApiKey(apiKey: string): Promise<void>;
    authenticate(username: string, password: string): Promise<string>;
    launchExecution(apiKey: string, testSetupName: string): Promise<string>;
    getExecutionStatus(apiKey: string, executionId: string): Promise<ExecutionStatusResponse>;
    getExecutionDetail(apiKey: string, executionId: string): Promise<ExecutionDetailResponse>;
    getScriptDetail(apiKey: string, executionId: string, testScript: string): Promise<ScriptExecDetailResponse>;
}
//# sourceMappingURL=client.d.ts.map