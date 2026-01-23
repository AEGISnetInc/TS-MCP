import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock keychain
const mockHasApiKey = jest.fn<() => Promise<boolean>>();
jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    hasApiKey: mockHasApiKey
  }))
}));

// Mock auth CLI
const mockRunAuthCli = jest.fn<() => Promise<void>>();
jest.unstable_mockModule('../../src/cli/auth.js', () => ({
  runAuthCli: mockRunAuthCli
}));

// Mock readline
const mockQuestion = jest.fn<(query: string, callback: (answer: string) => void) => void>();
const mockClose = jest.fn();
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

    // Reset module cache to get fresh import with mocks
    jest.resetModules();

    // Re-setup mocks after reset
    jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
      KeychainService: jest.fn().mockImplementation(() => ({
        hasApiKey: mockHasApiKey
      }))
    }));

    jest.unstable_mockModule('../../src/cli/auth.js', () => ({
      runAuthCli: mockRunAuthCli
    }));

    jest.unstable_mockModule('readline', () => ({
      createInterface: jest.fn().mockReturnValue({
        question: mockQuestion,
        close: mockClose
      })
    }));

    // Import after mocks are set up
    const module = await import('../../src/cli/status.js');
    runStatusCli = module.runStatusCli;
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  it('shows Authenticated: Yes when key exists', async () => {
    mockHasApiKey.mockResolvedValue(true);

    await runStatusCli();

    expect(mockConsoleLog).toHaveBeenCalledWith('Authenticated: Yes');
    expect(mockQuestion).not.toHaveBeenCalled();
  });

  it('shows Authenticated: No when no key', async () => {
    mockHasApiKey.mockResolvedValue(false);
    mockQuestion.mockImplementation((q, cb) => cb('n'));

    await runStatusCli();

    expect(mockConsoleLog).toHaveBeenCalledWith('Authenticated: No');
  });

  it('prompts and calls auth when user says yes', async () => {
    mockHasApiKey.mockResolvedValue(false);
    mockQuestion.mockImplementation((q, cb) => cb('y'));

    await runStatusCli();

    expect(mockRunAuthCli).toHaveBeenCalled();
  });

  it('does not call auth when user says no', async () => {
    mockHasApiKey.mockResolvedValue(false);
    mockQuestion.mockImplementation((q, cb) => cb('n'));

    await runStatusCli();

    expect(mockRunAuthCli).not.toHaveBeenCalled();
  });

  it('calls auth when user enters empty response (defaults to yes)', async () => {
    mockHasApiKey.mockResolvedValue(false);
    mockQuestion.mockImplementation((q, cb) => cb(''));

    await runStatusCli();

    expect(mockRunAuthCli).toHaveBeenCalled();
  });

  it('calls auth when user enters Y (uppercase)', async () => {
    mockHasApiKey.mockResolvedValue(false);
    mockQuestion.mockImplementation((q, cb) => cb('Y'));

    await runStatusCli();

    expect(mockRunAuthCli).toHaveBeenCalled();
  });
});
