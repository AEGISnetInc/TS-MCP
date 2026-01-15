import { jest } from '@jest/globals';
import { TouchstoneClient } from '../../src/touchstone/client.js';

// Mock global fetch
const mockFetch = jest.fn<typeof fetch>();
global.fetch = mockFetch;

describe('TouchstoneClient', () => {
  let client: TouchstoneClient;
  const baseUrl = 'https://touchstone.example.com';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new TouchstoneClient(baseUrl);
  });

  describe('authenticate', () => {
    it('sends credentials and returns API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 'API-Key': 'test-api-key' })
      } as Response);

      const result = await client.authenticate('user', 'pass');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/touchstone/api/authenticate`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ username: 'user', password: 'pass' })
        })
      );
      expect(result).toBe('test-api-key');
    });

    it('throws AuthenticationFailedError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      await expect(client.authenticate('user', 'wrong')).rejects.toThrow('Authentication failed');
    });
  });

  describe('launchExecution', () => {
    it('launches test execution and returns ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testExecId: 12345 })
      } as Response);

      const result = await client.launchExecution('api-key', 'Patient-CRUD');

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/touchstone/api/testExecution`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'API-Key': 'api-key'
          }),
          body: JSON.stringify({ testSetup: 'Patient-CRUD' })
        })
      );
      expect(result).toBe(12345);
    });

    it('throws SessionExpiredError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      await expect(client.launchExecution('expired-key', 'Test')).rejects.toThrow('Session expired');
    });
  });

  describe('getExecutionStatus', () => {
    it('returns execution status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ testExecId: 12345, status: 'Running' })
      } as Response);

      const result = await client.getExecutionStatus('api-key', 12345);

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/touchstone/api/testExecution/12345`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'API-Key': 'api-key'
          })
        })
      );
      expect(result.status).toBe('Running');
    });
  });

  describe('getExecutionDetail', () => {
    it('returns execution details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          testExecId: 12345,
          status: 'Passed',
          scriptResults: [
            { testScriptName: 'Patient-read', status: 'Passed', passCount: 5, failCount: 0 }
          ]
        })
      } as Response);

      const result = await client.getExecutionDetail('api-key', 12345);

      expect(result.scriptResults).toHaveLength(1);
      expect(result.scriptResults![0].testScriptName).toBe('Patient-read');
    });
  });

  describe('error handling', () => {
    it('throws NetworkError on fetch failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.authenticate('user', 'pass')).rejects.toThrow('Cannot reach Touchstone API');
    });

    it('throws ExecutionNotFoundError on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response);

      await expect(client.getExecutionStatus('api-key', 99999)).rejects.toThrow('not found');
    });

    it('throws TouchstoneError on 500', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      await expect(client.getExecutionStatus('api-key', 12345)).rejects.toThrow('Touchstone service error');
    });
  });
});
