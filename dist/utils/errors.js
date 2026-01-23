export class TSMCPError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'TSMCPError';
    }
}
export class NotAuthenticatedError extends TSMCPError {
    constructor() {
        super('Not authenticated. Run "npx ts-mcp auth" to authenticate.', 'NOT_AUTHENTICATED');
    }
}
export class AuthenticationFailedError extends TSMCPError {
    constructor() {
        super('Authentication failed. Check your Touchstone credentials.', 'AUTHENTICATION_FAILED');
    }
}
export class SessionExpiredError extends TSMCPError {
    constructor() {
        super('Session expired. Run "npx ts-mcp auth" to re-authenticate.', 'SESSION_EXPIRED');
    }
}
export class TouchstoneApiKeyExpiredError extends TSMCPError {
    constructor() {
        super('Touchstone API key expired', 'TOUCHSTONE_API_KEY_EXPIRED', { action: 'npx github:AEGISnetinc/TS-MCP login' });
    }
}
export class TestSetupNotFoundError extends TSMCPError {
    constructor(setupName) {
        super(`Test Setup '${setupName}' not found. Verify the name in Touchstone UI.`, 'TEST_SETUP_NOT_FOUND', { setupName });
    }
}
export class ExecutionNotFoundError extends TSMCPError {
    constructor(executionId) {
        super(`Execution ID '${executionId}' not found.`, 'EXECUTION_NOT_FOUND', { executionId });
    }
}
export class NetworkError extends TSMCPError {
    constructor() {
        super('Cannot reach Touchstone API. Check your network.', 'NETWORK_ERROR');
    }
}
export class TouchstoneError extends TSMCPError {
    constructor(statusCode) {
        super('Touchstone service error. Try again later.', 'TOUCHSTONE_ERROR', { statusCode });
    }
}
export function formatErrorResponse(error) {
    if (error instanceof TSMCPError) {
        // Extract action from details if present
        const action = error.details?.action;
        const otherDetails = error.details
            ? Object.fromEntries(Object.entries(error.details).filter(([key]) => key !== 'action'))
            : undefined;
        const hasOtherDetails = otherDetails && Object.keys(otherDetails).length > 0;
        return {
            error: error.message,
            code: error.code,
            ...(action && { action }),
            ...(hasOtherDetails && { details: otherDetails })
        };
    }
    if (error instanceof Error) {
        return {
            error: error.message,
            code: 'UNKNOWN_ERROR'
        };
    }
    return {
        error: 'An unknown error occurred',
        code: 'UNKNOWN_ERROR'
    };
}
//# sourceMappingURL=errors.js.map