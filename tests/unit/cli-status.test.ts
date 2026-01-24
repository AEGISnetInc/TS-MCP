import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock functions
const mockGetApiKey = jest.fn<() => Promise<string | null>>();
const mockValidateApiKey = jest.fn<() => Promise<void>>();
const mockCanAutoRefresh = jest.fn<() => Promise<boolean>>();
const mockRefreshApiKey = jest.fn<() => Promise<string | null>>();
const mockRunAuthCli = jest.fn<() => Promise<void>>();
const mockQuestion = jest.fn<(query: string, callback: (answer: string) => void) => void>();
const mockClose = jest.fn();

// Mock keychain
jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    getApiKey: mockGetApiKey
  }))
}));

// Mock TouchstoneClient
jest.unstable_mockModule('../../src/touchstone/client.js', () => ({
  TouchstoneClient: jest.fn().mockImplementation(() => ({
    validateApiKey: mockValidateApiKey
  }))
}));

// Mock LocalAuthProvider
jest.unstable_mockModule('../../src/auth/local-auth-provider.js', () => ({
  LocalAuthProvider: jest.fn().mockImplementation(() => ({
    canAutoRefresh: mockCanAutoRefresh,
    refreshApiKey: mockRefreshApiKey
  }))
}));

// Mock config
jest.unstable_mockModule('../../src/utils/config.js', () => ({
  getConfig: jest.fn().mockReturnValue({ touchstoneBaseUrl: 'https://touchstone.example.com' })
}));

// Mock errors
const { TouchstoneApiKeyExpiredError } = await import('../../src/utils/errors.js');
jest.unstable_mockModule('../../src/utils/errors.js', () => ({
  TouchstoneApiKeyExpiredError
}));

// Mock auth CLI
jest.unstable_mockModule('../../src/cli/auth.js', () => ({
  runAuthCli: mockRunAuthCli
}));

// Mock readline
jest.unstable_mockModule('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    question: mockQuestion,
    close: mockClose
  })
}));

describe('runStatusCli', () => {
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let runStatusCli: () => Promise<void>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockRunAuthCli.mockResolvedValue(undefined);

    // Import after mocks are set up
    const module = await import('../../src/cli/status.js');
    runStatusCli = module.runStatusCli;
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('when no API key exists', () => {
    beforeEach(() => {
      mockGetApiKey.mockResolvedValue(null);
    });

    it('shows Authenticated: No', async () => {
      mockQuestion.mockImplementation((q, cb) => cb('n'));

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Authenticated: No');
    });

    it('prompts and calls auth when user says yes', async () => {
      mockQuestion.mockImplementation((q, cb) => cb('y'));

      await runStatusCli();

      expect(mockRunAuthCli).toHaveBeenCalled();
    });

    it('does not call auth when user says no', async () => {
      mockQuestion.mockImplementation((q, cb) => cb('n'));

      await runStatusCli();

      expect(mockRunAuthCli).not.toHaveBeenCalled();
    });
  });

  describe('when API key exists and is valid', () => {
    beforeEach(() => {
      mockGetApiKey.mockResolvedValue('valid-api-key');
      mockValidateApiKey.mockResolvedValue(undefined);
    });

    it('shows Authenticated: Yes and API Key: Valid', async () => {
      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Authenticated: Yes');
      expect(mockConsoleLog).toHaveBeenCalledWith('API Key: Valid');
    });

    it('does not prompt for auth', async () => {
      await runStatusCli();

      expect(mockQuestion).not.toHaveBeenCalled();
    });
  });

  describe('when API key is expired', () => {
    beforeEach(() => {
      mockGetApiKey.mockResolvedValue('expired-api-key');
      mockValidateApiKey.mockRejectedValue(new TouchstoneApiKeyExpiredError());
    });

    it('shows API Key: Expired', async () => {
      mockCanAutoRefresh.mockResolvedValue(false);
      mockQuestion.mockImplementation((q, cb) => cb('n'));

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('API Key: Expired');
    });

    describe('with stored credentials', () => {
      beforeEach(() => {
        mockCanAutoRefresh.mockResolvedValue(true);
      });

      it('auto-refreshes successfully', async () => {
        mockRefreshApiKey.mockResolvedValue('new-api-key');

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Refreshing API key...');
        expect(mockConsoleLog).toHaveBeenCalledWith('✓ API key refreshed successfully.');
        expect(mockRunAuthCli).not.toHaveBeenCalled();
      });

      it('prompts for re-auth when auto-refresh fails', async () => {
        mockRefreshApiKey.mockRejectedValue(new Error('Auth failed'));
        mockQuestion.mockImplementation((q, cb) => cb('y'));

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('✗ Auto-refresh failed.');
        expect(mockRunAuthCli).toHaveBeenCalled();
      });
    });

    describe('without stored credentials', () => {
      beforeEach(() => {
        mockCanAutoRefresh.mockResolvedValue(false);
      });

      it('prompts for re-auth', async () => {
        mockQuestion.mockImplementation((q, cb) => cb('y'));

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('No stored credentials for auto-refresh.');
        expect(mockRunAuthCli).toHaveBeenCalled();
      });
    });
  });
});
