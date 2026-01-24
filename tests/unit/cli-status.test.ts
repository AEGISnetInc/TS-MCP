import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock functions
const mockGetApiKey = jest.fn<() => Promise<string | null>>();
const mockHasCredentials = jest.fn<() => Promise<boolean>>();
const mockRunAuthCli = jest.fn<() => Promise<void>>();
const mockQuestion = jest.fn<(query: string, callback: (answer: string) => void) => void>();
const mockClose = jest.fn();

// Mock keychain
jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    getApiKey: mockGetApiKey,
    hasCredentials: mockHasCredentials
  }))
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
      mockHasCredentials.mockResolvedValue(false);
    });

    it('shows API Key: Not stored', async () => {
      mockQuestion.mockImplementation((q, cb) => cb('n'));

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('API Key: Not stored');
    });

    it('shows Credentials: Not stored when no credentials', async () => {
      mockQuestion.mockImplementation((q, cb) => cb('n'));

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Credentials: Not stored');
    });

    it('shows Credentials: Stored when credentials exist', async () => {
      mockHasCredentials.mockResolvedValue(true);
      mockQuestion.mockImplementation((q, cb) => cb('n'));

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Credentials: Stored (for auto-refresh)');
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

  describe('when API key exists', () => {
    beforeEach(() => {
      mockGetApiKey.mockResolvedValue('stored-api-key');
    });

    it('shows API Key: Stored', async () => {
      mockHasCredentials.mockResolvedValue(false);

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('API Key: Stored');
    });

    it('shows Credentials: Not stored when no credentials', async () => {
      mockHasCredentials.mockResolvedValue(false);

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Credentials: Not stored');
    });

    it('shows Credentials: Stored when credentials exist', async () => {
      mockHasCredentials.mockResolvedValue(true);

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Credentials: Stored (for auto-refresh)');
    });

    it('does not prompt for auth', async () => {
      mockHasCredentials.mockResolvedValue(true);

      await runStatusCli();

      expect(mockQuestion).not.toHaveBeenCalled();
    });

    it('shows note about auto-refresh', async () => {
      mockHasCredentials.mockResolvedValue(true);

      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('Note: API key validity is checked when you run a test.');
      expect(mockConsoleLog).toHaveBeenCalledWith('If expired, it will auto-refresh using stored credentials.');
    });
  });
});
