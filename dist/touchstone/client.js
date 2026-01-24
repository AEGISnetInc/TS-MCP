import { AuthenticationFailedError, TouchstoneApiKeyExpiredError, ExecutionNotFoundError, NetworkError, TouchstoneError } from '../utils/errors.js';
export class TouchstoneClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async request(endpoint, options, apiKey) {
        const url = `${this.baseUrl}/touchstone/api${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(apiKey && { 'API-Key': apiKey })
        };
        let response;
        try {
            response = await fetch(url, { ...options, headers });
        }
        catch {
            throw new NetworkError();
        }
        if (!response.ok) {
            this.handleErrorResponse(response.status, endpoint);
        }
        return response.json();
    }
    handleErrorResponse(status, endpoint) {
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
    async validateApiKey(apiKey) {
        // Use a request that will return 401 if key is expired, or any other response if valid
        // Getting status for ID "0" should return 404 if key is valid, 401 if expired
        try {
            await this.request('/testExecution/0', { method: 'GET' }, apiKey);
        }
        catch (error) {
            if (error instanceof ExecutionNotFoundError) {
                // 404 means the key is valid, just the execution doesn't exist
                return;
            }
            throw error;
        }
    }
    async authenticate(username, password) {
        const data = await this.request('/authenticate', {
            method: 'POST',
            body: JSON.stringify({ email: username, password })
        });
        return data['API-Key'];
    }
    async launchExecution(apiKey, testSetupName) {
        const data = await this.request('/testExecution', {
            method: 'POST',
            body: JSON.stringify({ testSetup: testSetupName })
        }, apiKey);
        return String(data.testExecId);
    }
    async getExecutionStatus(apiKey, executionId) {
        return this.request(`/testExecution/${executionId}`, { method: 'GET' }, apiKey);
    }
    async getExecutionDetail(apiKey, executionId) {
        return this.request(`/testExecDetail/${executionId}`, { method: 'GET' }, apiKey);
    }
    async getScriptDetail(apiKey, executionId, testScript) {
        const encodedScript = encodeURIComponent(testScript);
        return this.request(`/scriptExecDetail/${executionId}?testscript=${encodedScript}`, { method: 'GET' }, apiKey);
    }
}
//# sourceMappingURL=client.js.map