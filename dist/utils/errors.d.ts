export declare class TSMCPError extends Error {
    readonly code: string;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
export declare class NotAuthenticatedError extends TSMCPError {
    constructor();
}
export declare class AuthenticationFailedError extends TSMCPError {
    constructor();
}
export declare class SessionExpiredError extends TSMCPError {
    constructor();
}
export declare class TouchstoneApiKeyExpiredError extends TSMCPError {
    constructor();
}
export declare class TestSetupNotFoundError extends TSMCPError {
    constructor(setupName: string);
}
export declare class ExecutionNotFoundError extends TSMCPError {
    constructor(executionId: string);
}
export declare class NetworkError extends TSMCPError {
    constructor();
}
export declare class TouchstoneError extends TSMCPError {
    constructor(statusCode?: number);
}
export interface ErrorResponse {
    error: string;
    code: string;
    action?: string;
    details?: Record<string, unknown>;
}
export declare function formatErrorResponse(error: unknown): ErrorResponse;
//# sourceMappingURL=errors.d.ts.map