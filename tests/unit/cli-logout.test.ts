import { jest } from '@jest/globals';
import { EventEmitter } from 'events';

// Mock dependencies BEFORE importing the module
const mockSetPassword = jest.fn<() => Promise<void>>();
const mockGetPassword = jest.fn<() => Promise<string | null>>();
const mockDeletePassword = jest.fn<() => Promise<boolean>>();
const mockFetch = jest.fn<() => Promise<Response>>();

// Mock keytar
jest.unstable_mockModule('keytar', () => ({
  default: {
    setPassword: mockSetPassword,
    getPassword: mockGetPassword,
    deletePassword: mockDeletePassword
  }
}));

// Mock fs
const mockExistsSync = jest.fn<() => boolean>();
const mockReadFileSync = jest.fn<() => string>();

jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync
}));

// Import after mocks are set up
const { runLogoutCli } = await import('../../src/cli/logout.js');

describe('CLI Logout', () => {
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let mockConsoleError: jest.SpiedFunction<typeof console.error>;
  let mockProcessExit: jest.SpiedFunction<typeof process.exit>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original fetch and replace
    originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof global.fetch;

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
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  describe('module exports', () => {
    it('exports runLogoutCli function', () => {
      expect(runLogoutCli).toBeDefined();
      expect(typeof runLogoutCli).toBe('function');
    });
  });

  describe('runLogoutCli', () => {
    it('logs out successfully when session exists', async () => {
      // Setup: session token exists in keychain
      mockGetPassword.mockResolvedValue('existing-session-token');
      mockDeletePassword.mockResolvedValue(true);

      // Setup: server acknowledges logout
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' })
      } as Response);

      await runLogoutCli();

      // Verify keychain was queried with correct account name
      expect(mockGetPassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://ts-mcp.example.com'
      );

      // Verify logout endpoint was called with Bearer token
      expect(mockFetch).toHaveBeenCalledWith(
        'https://ts-mcp.example.com/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer existing-session-token'
          }
        })
      );

      // Verify session token was deleted from keychain
      expect(mockDeletePassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://ts-mcp.example.com'
      );

      // Verify success message
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Logged out'));
    });

    it('shows message when not logged in (no session token)', async () => {
      // Setup: no session token in keychain
      mockGetPassword.mockResolvedValue(null);

      await runLogoutCli();

      // Verify no logout endpoint was called
      expect(mockFetch).not.toHaveBeenCalled();

      // Verify no deletion was attempted
      expect(mockDeletePassword).not.toHaveBeenCalled();

      // Verify appropriate message
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Not logged in'));
    });

    it('exits with error when no cloud server is configured', async () => {
      // No MCP config file
      mockExistsSync.mockReturnValue(false);

      await expect(runLogoutCli()).rejects.toThrow('process.exit called');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No cloud server configured'));
    });

    it('still deletes local token when server is unreachable', async () => {
      // Setup: session token exists
      mockGetPassword.mockResolvedValue('existing-session-token');
      mockDeletePassword.mockResolvedValue(true);

      // Setup: server is unreachable (network error)
      mockFetch.mockRejectedValue(new Error('Network error'));

      await runLogoutCli();

      // Verify deletion was still attempted
      expect(mockDeletePassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://ts-mcp.example.com'
      );

      // Verify success message (local logout succeeds even if server is down)
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Logged out'));
    });

    it('still deletes local token when server returns error', async () => {
      // Setup: session token exists
      mockGetPassword.mockResolvedValue('existing-session-token');
      mockDeletePassword.mockResolvedValue(true);

      // Setup: server returns error (e.g., session already expired)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Session not found' })
      } as Response);

      await runLogoutCli();

      // Verify deletion was still attempted
      expect(mockDeletePassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://ts-mcp.example.com'
      );

      // Verify success message
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Logged out'));
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

      mockGetPassword.mockResolvedValue('session-token-for-server2');
      mockDeletePassword.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Logged out' })
      } as Response);

      // Pass specific server name
      await runLogoutCli('server2');

      // Verify the correct server URL was used
      expect(mockGetPassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://server2.example.com'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://server2.example.com/auth/logout',
        expect.any(Object)
      );

      expect(mockDeletePassword).toHaveBeenCalledWith(
        'ts-mcp',
        'session:https://server2.example.com'
      );
    });

    it('strips /mcp path from server URL', async () => {
      mockGetPassword.mockResolvedValue('session-token');
      mockDeletePassword.mockResolvedValue(true);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Logged out' })
      } as Response);

      await runLogoutCli();

      // The /mcp path should be stripped
      expect(mockFetch).toHaveBeenCalledWith(
        'https://ts-mcp.example.com/auth/logout',
        expect.any(Object)
      );
    });

    it('prints header at start', async () => {
      mockGetPassword.mockResolvedValue(null);

      await runLogoutCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('TS-MCP Cloud Logout\n');
    });

    it('returns silently when server name does not exist in config', async () => {
      // Config with only one server
      mockReadFileSync.mockReturnValue(JSON.stringify({
        mcpServers: {
          server1: {
            url: 'https://server1.example.com/mcp'
          }
        }
      }));

      // Try to logout from non-existent server
      await expect(runLogoutCli('nonexistent')).rejects.toThrow('process.exit called');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('handles config file with no mcpServers', async () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      await expect(runLogoutCli()).rejects.toThrow('process.exit called');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('No cloud server configured'));
    });

    it('handles invalid JSON in config file', async () => {
      mockReadFileSync.mockReturnValue('not valid json');

      await expect(runLogoutCli()).rejects.toThrow('process.exit called');

      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });
});
