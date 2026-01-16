import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock dependencies BEFORE importing the module
const mockAuthenticate = jest.fn<() => Promise<string>>();
const mockSetApiKey = jest.fn<() => Promise<void>>();
const mockGetConfig = jest.fn();

// Mock readline
type QuestionCallback = (answer: string) => void;
const mockRlQuestion = jest.fn<(prompt: string, callback: QuestionCallback) => void>();
const mockRlClose = jest.fn();
const mockCreateInterface = jest.fn();

jest.unstable_mockModule('readline', () => ({
  createInterface: mockCreateInterface
}));

jest.unstable_mockModule('../../src/touchstone/client.js', () => ({
  TouchstoneClient: jest.fn().mockImplementation(() => ({
    authenticate: mockAuthenticate
  }))
}));

jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: jest.fn().mockImplementation(() => ({
    setApiKey: mockSetApiKey
  }))
}));

jest.unstable_mockModule('../../src/utils/config.js', () => ({
  getConfig: mockGetConfig
}));

// Import after mocks are set up
const { runAuthCli } = await import('../../src/cli/auth.js');

describe('CLI Auth', () => {
  let mockStdin: EventEmitter & { isTTY?: boolean; setRawMode?: jest.Mock; resume?: jest.Mock };
  let mockStdoutWrite: jest.SpiedFunction<typeof process.stdout.write>;
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let mockConsoleError: jest.SpiedFunction<typeof console.error>;
  let mockProcessExit: jest.SpiedFunction<typeof process.exit>;
  let originalStdin: typeof process.stdin;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock stdin as EventEmitter
    mockStdin = new EventEmitter();
    mockStdin.isTTY = true;
    mockStdin.setRawMode = jest.fn();
    mockStdin.resume = jest.fn();

    // Store original stdin and replace
    originalStdin = process.stdin;
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true
    });

    // Mock stdout.write
    mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Default config
    mockGetConfig.mockReturnValue({ touchstoneBaseUrl: 'https://touchstone.example.com' });

    // Setup readline mock to use callback pattern
    mockCreateInterface.mockReturnValue({
      question: mockRlQuestion,
      close: mockRlClose
    });
  });

  afterEach(() => {
    // Restore original stdin
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true
    });

    mockStdoutWrite.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('runAuthCli', () => {
    it('authenticates successfully and stores API key', async () => {
      // Setup: readline.question calls back with username
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      // Setup: authenticate returns API key
      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      // Run auth CLI in background, then simulate password input
      const authPromise = runAuthCli();

      // Wait a tick for the password prompt to be set up
      await new Promise(resolve => setImmediate(resolve));

      // Simulate typing password and pressing Enter
      mockStdin.emit('data', Buffer.from('secret123'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      // Verify authentication was called with correct credentials
      expect(mockAuthenticate).toHaveBeenCalledWith('user@example.com', 'secret123');

      // Verify API key was stored
      expect(mockSetApiKey).toHaveBeenCalledWith('test-api-key');

      // Verify success message
      expect(mockConsoleLog).toHaveBeenCalledWith('✓ Authenticated successfully. API key stored in keychain.');
    });

    it('exits with error when username is empty', async () => {
      // Setup: readline.question calls back with empty username
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('');
      });

      const authPromise = runAuthCli();

      // Wait for password prompt
      await new Promise(resolve => setImmediate(resolve));

      // Simulate entering password (but username is empty)
      mockStdin.emit('data', Buffer.from('secret123'));
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(authPromise).rejects.toThrow('process.exit called');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith('Error: Username and password are required.');
    });

    it('exits with error when password is empty', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      // Simulate pressing Enter without typing password
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(authPromise).rejects.toThrow('process.exit called');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith('Error: Username and password are required.');
    });

    it('exits with error when authentication fails', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      // Setup: authentication throws error
      mockAuthenticate.mockRejectedValue(new Error('Invalid credentials'));

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('wrongpassword'));
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(authPromise).rejects.toThrow('process.exit called');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith('\nAuthentication failed: Invalid credentials');
    });

    it('handles non-Error exceptions', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      // Setup: authentication throws non-Error
      mockAuthenticate.mockRejectedValue('string error');

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('password'));
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(authPromise).rejects.toThrow('process.exit called');
      expect(mockConsoleError).toHaveBeenCalledWith('\nAuthentication failed: Unknown error');
    });

    it('shows asterisks for each password character', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      // Type password character by character
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('b'));
      mockStdin.emit('data', Buffer.from('c'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      // Verify asterisks were written for each character
      expect(mockStdoutWrite).toHaveBeenCalledWith('*');
      // Should have been called 3 times for 'abc'
      const asteriskCalls = mockStdoutWrite.mock.calls.filter(call => call[0] === '*');
      expect(asteriskCalls).toHaveLength(3);
    });

    it('handles backspace in password', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      // Type 'abc', then backspace twice, then 'xy'
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('b'));
      mockStdin.emit('data', Buffer.from('c'));
      mockStdin.emit('data', Buffer.from('\u007F')); // Backspace
      mockStdin.emit('data', Buffer.from('\u007F')); // Backspace
      mockStdin.emit('data', Buffer.from('x'));
      mockStdin.emit('data', Buffer.from('y'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      // Password should be 'axy' (abc - 2 chars + xy)
      expect(mockAuthenticate).toHaveBeenCalledWith('user@example.com', 'axy');
    });

    it('handles Ctrl+D to submit password', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('password'));
      mockStdin.emit('data', Buffer.from('\u0004')); // Ctrl+D

      await authPromise;

      expect(mockAuthenticate).toHaveBeenCalledWith('user@example.com', 'password');
    });

    it('sets raw mode on TTY stdin', async () => {
      mockStdin.isTTY = true;

      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      // Verify raw mode was enabled
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);

      mockStdin.emit('data', Buffer.from('p'));
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      // Verify raw mode was disabled after password entry
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    });

    it('skips raw mode for non-TTY stdin', async () => {
      mockStdin.isTTY = false;

      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('p'));
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      // setRawMode should not have been called
      expect(mockStdin.setRawMode).not.toHaveBeenCalled();
    });

    it('prints initial authentication header', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('p'));
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      expect(mockConsoleLog).toHaveBeenCalledWith('Touchstone Authentication\n');
    });

    it('prints authenticating message before API call', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('p'));
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      expect(mockConsoleLog).toHaveBeenCalledWith('\nAuthenticating...');
    });

    it('prints follow-up instructions after success', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockAuthenticate.mockResolvedValue('test-api-key');
      mockSetApiKey.mockResolvedValue();

      const authPromise = runAuthCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('p'));
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('s'));
      mockStdin.emit('data', Buffer.from('\r'));

      await authPromise;

      expect(mockConsoleLog).toHaveBeenCalledWith('\nYou can now use TS-MCP tools in Claude Code without re-authenticating.');
    });
  });
});
