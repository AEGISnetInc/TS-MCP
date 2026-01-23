import {
  TSMCPError,
  NotAuthenticatedError,
  AuthenticationFailedError,
  SessionExpiredError,
  TouchstoneApiKeyExpiredError,
  TestSetupNotFoundError,
  ExecutionNotFoundError,
  NetworkError,
  TouchstoneError,
  formatErrorResponse
} from '../../src/utils/errors.js';

describe('TSMCPError', () => {
  it('creates error with message and code', () => {
    const error = new TSMCPError('Test error', 'TEST_ERROR');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('TSMCPError');
  });

  it('creates error with optional details', () => {
    const error = new TSMCPError('Test error', 'TEST_ERROR', { foo: 'bar' });
    expect(error.details).toEqual({ foo: 'bar' });
  });
});

describe('NotAuthenticatedError', () => {
  it('has correct message and code', () => {
    const error = new NotAuthenticatedError();
    expect(error.message).toBe('Not authenticated. Run "npx ts-mcp auth" to authenticate.');
    expect(error.code).toBe('NOT_AUTHENTICATED');
  });
});

describe('AuthenticationFailedError', () => {
  it('has correct message and code', () => {
    const error = new AuthenticationFailedError();
    expect(error.message).toBe('Authentication failed. Check your Touchstone credentials.');
    expect(error.code).toBe('AUTHENTICATION_FAILED');
  });
});

describe('SessionExpiredError', () => {
  it('has correct message and code', () => {
    const error = new SessionExpiredError();
    expect(error.message).toBe('Session expired. Run "npx ts-mcp auth" to re-authenticate.');
    expect(error.code).toBe('SESSION_EXPIRED');
  });
});

describe('TouchstoneApiKeyExpiredError', () => {
  it('has correct message and code', () => {
    const error = new TouchstoneApiKeyExpiredError();
    expect(error.message).toBe('Touchstone API key expired');
    expect(error.code).toBe('TOUCHSTONE_API_KEY_EXPIRED');
  });

  it('includes action in details', () => {
    const error = new TouchstoneApiKeyExpiredError();
    expect(error.details).toEqual({ action: 'npx github:AEGISnetinc/TS-MCP login' });
  });
});

describe('TestSetupNotFoundError', () => {
  it('includes setup name in message', () => {
    const error = new TestSetupNotFoundError('Patient-CRUD');
    expect(error.message).toBe("Test Setup 'Patient-CRUD' not found. Verify the name in Touchstone UI.");
    expect(error.code).toBe('TEST_SETUP_NOT_FOUND');
  });

  it('includes setup name in details', () => {
    const error = new TestSetupNotFoundError('Patient-CRUD');
    expect(error.details).toEqual({ setupName: 'Patient-CRUD' });
  });
});

describe('ExecutionNotFoundError', () => {
  it('includes execution ID in message', () => {
    const error = new ExecutionNotFoundError('exec-123');
    expect(error.message).toBe("Execution ID 'exec-123' not found.");
    expect(error.code).toBe('EXECUTION_NOT_FOUND');
  });

  it('includes execution ID in details', () => {
    const error = new ExecutionNotFoundError('exec-123');
    expect(error.details).toEqual({ executionId: 'exec-123' });
  });
});

describe('NetworkError', () => {
  it('has correct message and code', () => {
    const error = new NetworkError();
    expect(error.message).toBe('Cannot reach Touchstone API. Check your network.');
    expect(error.code).toBe('NETWORK_ERROR');
  });
});

describe('TouchstoneError', () => {
  it('has correct message and code', () => {
    const error = new TouchstoneError();
    expect(error.message).toBe('Touchstone service error. Try again later.');
    expect(error.code).toBe('TOUCHSTONE_ERROR');
  });

  it('includes status code in details when provided', () => {
    const error = new TouchstoneError(500);
    expect(error.details).toEqual({ statusCode: 500 });
  });
});

describe('formatErrorResponse', () => {
  it('formats TSMCPError correctly', () => {
    const error = new NotAuthenticatedError();
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: 'Not authenticated. Run "npx ts-mcp auth" to authenticate.',
      code: 'NOT_AUTHENTICATED'
    });
  });

  it('includes details when present', () => {
    const error = new TestSetupNotFoundError('Patient-CRUD');
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: "Test Setup 'Patient-CRUD' not found. Verify the name in Touchstone UI.",
      code: 'TEST_SETUP_NOT_FOUND',
      details: { setupName: 'Patient-CRUD' }
    });
  });

  it('formats generic Error as unknown error', () => {
    const error = new Error('Something broke');
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: 'Something broke',
      code: 'UNKNOWN_ERROR'
    });
  });

  it('handles non-Error objects', () => {
    const response = formatErrorResponse('string error');
    expect(response).toEqual({
      error: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR'
    });
  });

  it('extracts action to top level from details', () => {
    const error = new TouchstoneApiKeyExpiredError();
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: 'Touchstone API key expired',
      code: 'TOUCHSTONE_API_KEY_EXPIRED',
      action: 'npx github:AEGISnetinc/TS-MCP login'
    });
  });

  it('includes both action and other details when present', () => {
    const error = new TSMCPError('Custom error', 'CUSTOM', {
      action: 'npx github:AEGISnetinc/TS-MCP login',
      extra: 'info'
    });
    const response = formatErrorResponse(error);
    expect(response).toEqual({
      error: 'Custom error',
      code: 'CUSTOM',
      action: 'npx github:AEGISnetinc/TS-MCP login',
      details: { extra: 'info' }
    });
  });
});
