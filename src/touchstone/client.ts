import {
  AuthenticationFailedError,
  TouchstoneApiKeyExpiredError,
  ExecutionNotFoundError,
  NetworkError,
  TouchstoneError
} from '../utils/errors.js';
import type { ExecutionStatusResponse, ExecutionDetailResponse, ScriptExecDetailResponse } from './types.js';

export class TouchstoneClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(
    endpoint: string,
    options: RequestInit,
    apiKey?: string
  ): Promise<T> {
    const url = `${this.baseUrl}/touchstone/api${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(apiKey && { 'API-Key': apiKey })
    };

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      throw new NetworkError();
    }

    if (!response.ok) {
      this.handleErrorResponse(response.status, endpoint);
    }

    return response.json() as Promise<T>;
  }

  private handleErrorResponse(status: number, endpoint: string): never {
    if (status === 401) {
      if (endpoint === '/authenticate') {
        throw new AuthenticationFailedError();
      }
      throw new TouchstoneApiKeyExpiredError();
    }
    if (status === 404) {
      throw new ExecutionNotFoundError(endpoint);
    }
    throw new TouchstoneError(status);
  }

  /**
   * Validate an API key by making a lightweight authenticated request.
   * Throws TouchstoneApiKeyExpiredError if the key is invalid/expired.
   */
  async validateApiKey(apiKey: string): Promise<void> {
    // Use a request that will return 401 if key is expired, or any other response if valid
    // Getting status for ID "0" should return 404 if key is valid, 401 if expired
    try {
      await this.request<unknown>(
        '/testExecution/0',
        { method: 'GET' },
        apiKey
      );
    } catch (error) {
      if (error instanceof ExecutionNotFoundError) {
        // 404 means the key is valid, just the execution doesn't exist
        return;
      }
      throw error;
    }
  }

  async authenticate(username: string, password: string): Promise<string> {
    const data = await this.request<{ 'API-Key': string }>(
      '/authenticate',
      {
        method: 'POST',
        body: JSON.stringify({ email: username, password })
      }
    );
    return data['API-Key'];
  }

  async launchExecution(apiKey: string, testSetupName: string): Promise<string> {
    const data = await this.request<{ testExecId: string }>(
      '/testExecution',
      {
        method: 'POST',
        body: JSON.stringify({ testSetup: testSetupName })
      },
      apiKey
    );
    return String(data.testExecId);
  }

  async getExecutionStatus(apiKey: string, executionId: string): Promise<ExecutionStatusResponse> {
    return this.request<ExecutionStatusResponse>(
      `/testExecution/${executionId}`,
      { method: 'GET' },
      apiKey
    );
  }

  async getExecutionDetail(apiKey: string, executionId: string): Promise<ExecutionDetailResponse> {
    return this.request<ExecutionDetailResponse>(
      `/testExecDetail/${executionId}`,
      { method: 'GET' },
      apiKey
    );
  }

  async getScriptDetail(apiKey: string, executionId: string, testScript: string): Promise<ScriptExecDetailResponse> {
    const encodedScript = encodeURIComponent(testScript);
    return this.request<ScriptExecDetailResponse>(
      `/scriptExecDetail/${executionId}?testscript=${encodedScript}`,
      { method: 'GET' },
      apiKey
    );
  }
}
