export class TSMCPError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
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

export class TestSetupNotFoundError extends TSMCPError {
  constructor(setupName: string) {
    super(
      `Test Setup '${setupName}' not found. Verify the name in Touchstone UI.`,
      'TEST_SETUP_NOT_FOUND',
      { setupName }
    );
  }
}

export class ExecutionNotFoundError extends TSMCPError {
  constructor(executionId: string) {
    super(`Execution ID '${executionId}' not found.`, 'EXECUTION_NOT_FOUND', { executionId });
  }
}

export class NetworkError extends TSMCPError {
  constructor() {
    super('Cannot reach Touchstone API. Check your network.', 'NETWORK_ERROR');
  }
}

export class TouchstoneError extends TSMCPError {
  constructor(statusCode?: number) {
    super('Touchstone service error. Try again later.', 'TOUCHSTONE_ERROR', { statusCode });
  }
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof TSMCPError) {
    return {
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details })
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
