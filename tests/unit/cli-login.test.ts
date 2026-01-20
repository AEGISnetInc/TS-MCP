import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock dependencies BEFORE importing the module
const mockSetPassword = jest.fn<() => Promise<void>>();
const mockGetPassword = jest.fn<() => Promise<string | null>>();
const mockFetch = jest.fn<() => Promise<Response>>();

// Mock keytar
jest.unstable_mockModule('keytar', () => ({
  default: {
    setPassword: mockSetPassword,
    getPassword: mockGetPassword,
    deletePassword: jest.fn()
  }
}));

// Mock fs
const mockExistsSync = jest.fn<() => boolean>();
const mockReadFileSync = jest.fn<() => string>();

jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync
}));

// Mock readline
type QuestionCallback = (answer: string) => void;
const mockRlQuestion = jest.fn<(prompt: string, callback: QuestionCallback) => void>();
const mockRlClose = jest.fn();
const mockCreateInterface = jest.fn();

jest.unstable_mockModule('readline', () => ({
  createInterface: mockCreateInterface
}));

// Import after mocks are set up
const { runLoginCli } = await import('../../src/cli/login.js');

describe('CLI Login', () => {
  let mockStdin: EventEmitter & { isTTY?: boolean; setRawMode?: jest.Mock; resume?: jest.Mock; pause?: jest.Mock };
  let mockStdoutWrite: jest.SpiedFunction<typeof process.stdout.write>;
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let mockConsoleError: jest.SpiedFunction<typeof console.error>;
  let mockProcessExit: jest.SpiedFunction<typeof process.exit>;
  let originalStdin: typeof process.stdin;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock stdin as EventEmitter
    mockStdin = new EventEmitter();
    mockStdin.isTTY = true;
    mockStdin.setRawMode = jest.fn();
    mockStdin.resume = jest.fn();
    mockStdin.pause = jest.fn();

    // Store original stdin and replace
    originalStdin = process.stdin;
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true
    });

    // Store original fetch and replace
    originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof global.fetch;

    // Mock stdout.write
    mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Mock console methods
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock process.exit
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Default mcp.json config
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      mcpServers: {
        touchstone: {
          url: 'https://ts-mcp.example.com/mcp'
        }
      }
    }));

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

    // Restore original fetch
    global.fetch = originalFetch;

    mockStdoutWrite.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('module exports', () => {
    it('exports runLoginCli function', () => {
      expect(runLoginCli).toBeDefined();
      expect(typeof runLoginCli).toBe('function');
    });
  });

  describe('runLoginCli', () => {
    it('logs in successfully and stores session token', async () => {
      // Setup: readline.question calls back with username
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      // Setup: server returns session token
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'test-session-token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      // Run login CLI in background, then simulate password input
      const loginPromise = runLoginCli();

      // Wait a tick for the password prompt to be set up
      await new Promise(resolve => setImmediate(resolve));

      // Simulate typing password and pressing Enter
      mockStdin.emit('data', Buffer.from('secret123'));
      mockStdin.emit('data', Buffer.from('\r'));

      await loginPromise;

      // Verify fetch was called with correct credentials
      expect(mockFetch).toHaveBeenCalledWith(
        'https://ts-mcp.example.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'user@example.com', password: 'secret123' })
        })
      );

      // Verify session token was stored with correct account name
      expect(mockSetPassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://ts-mcp.example.com',
        'test-session-token'
      );

      // Verify success message
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Logged in successfully'));
    });

    it('exits with error when no cloud server is configured', async () => {
      // No MCP config file
      mockExistsSync.mockReturnValue(false);

      await expect(runLoginCli()).rejects.toThrow('process.exit called');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No cloud server configured'));
    });

    it('exits with error when username is empty', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('');
      });

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      // Simulate entering password (but username is empty)
      mockStdin.emit('data', Buffer.from('secret123'));
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(loginPromise).rejects.toThrow('process.exit called');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Username and password are required'));
    });

    it('exits with error when password is empty', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      // Simulate pressing Enter without typing password
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(loginPromise).rejects.toThrow('process.exit called');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Username and password are required'));
    });

    it('exits with error when authentication fails', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      // Setup: server returns error
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      } as Response);

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('wrongpassword'));
      mockStdin.emit('data', Buffer.from('\r'));

      await expect(loginPromise).rejects.toThrow('process.exit called');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Login failed: Invalid credentials'));
    });

    it('shows asterisks for each password character', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'test-session-token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      // Type password character by character
      mockStdin.emit('data', Buffer.from('a'));
      mockStdin.emit('data', Buffer.from('b'));
      mockStdin.emit('data', Buffer.from('c'));
      mockStdin.emit('data', Buffer.from('\r'));

      await loginPromise;

      // Verify asterisks were written for each character
      expect(mockStdoutWrite).toHaveBeenCalledWith('*');
      // Should have been called 3 times for 'abc'
      const asteriskCalls = mockStdoutWrite.mock.calls.filter(call => call[0] === '*');
      expect(asteriskCalls).toHaveLength(3);
    });

    it('handles pasted password (multiple chars in single buffer)', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'test-session-token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      // Simulate paste - entire password comes in one buffer
      mockStdin.emit('data', Buffer.from('pastedpassword\r'));

      await loginPromise;

      // Verify password was captured correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ username: 'user@example.com', password: 'pastedpassword' })
        })
      );

      // Verify an asterisk was written for each character (14 chars)
      const asteriskCalls = mockStdoutWrite.mock.calls.filter(call => call[0] === '*');
      expect(asteriskCalls).toHaveLength(14);
    });

    it('handles backspace in password', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'test-session-token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      const loginPromise = runLoginCli();

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

      await loginPromise;

      // Password should be 'axy' (abc - 2 chars + xy)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ username: 'user@example.com', password: 'axy' })
        })
      );
    });

    it('uses specific server name when provided', async () => {
      // Config with multiple servers
      mockReadFileSync.mockReturnValue(JSON.stringify({
        mcpServers: {
          server1: {
            url: 'https://server1.example.com/mcp'
          },
          server2: {
            url: 'https://server2.example.com/mcp'
          }
        }
      }));

      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'test-session-token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      // Pass specific server name
      const loginPromise = runLoginCli('server2');

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('password\r'));

      await loginPromise;

      // Verify the correct server was used
      expect(mockFetch).toHaveBeenCalledWith(
        'https://server2.example.com/auth/login',
        expect.any(Object)
      );

      // Verify session token was stored with correct account name
      expect(mockSetPassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://server2.example.com',
        'test-session-token'
      );
    });

    it('strips /mcp path from server URL for auth endpoint', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('pass\r'));

      await loginPromise;

      // The /mcp path should be stripped and /auth/login appended
      expect(mockFetch).toHaveBeenCalledWith(
        'https://ts-mcp.example.com/auth/login',
        expect.any(Object)
      );
    });

    it('prints header and server URL at start', async () => {
      mockRlQuestion.mockImplementation((_prompt: string, callback: (answer: string) => void) => {
        callback('user@example.com');
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          sessionToken: 'token',
          expiresAt: '2026-02-19T00:00:00Z',
          user: 'user@example.com'
        })
      } as Response);

      mockSetPassword.mockResolvedValue();

      const loginPromise = runLoginCli();

      await new Promise(resolve => setImmediate(resolve));

      mockStdin.emit('data', Buffer.from('pass\r'));

      await loginPromise;

      expect(mockConsoleLog).toHaveBeenCalledWith('TS-MCP Cloud Login\n');
      expect(mockConsoleLog).toHaveBeenCalledWith('Server: https://ts-mcp.example.com\n');
    });
  });
});
