import { jest } from '@jest/globals';

// Mock dependencies BEFORE importing the module
const mockGetPassword = jest.fn<(service: string, account: string) => Promise<string | null>>();
const mockFetch = jest.fn<() => Promise<Response>>();

// Mock keytar
jest.unstable_mockModule('keytar', () => ({
  default: {
    setPassword: jest.fn(),
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

// Import after mocks are set up
const { runStatusCli } = await import('../../src/cli/status.js');

describe('CLI Status', () => {
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();

    // Store original fetch and replace
    originalFetch = global.fetch;
    global.fetch = mockFetch as unknown as typeof global.fetch;

    // Mock console.log
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Default: no mcp.json config
    mockExistsSync.mockReturnValue(false);
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    mockConsoleLog.mockRestore();
  });

  describe('module exports', () => {
    it('exports runStatusCli function', () => {
      expect(runStatusCli).toBeDefined();
      expect(typeof runStatusCli).toBe('function');
    });
  });

  describe('runStatusCli', () => {
    it('prints header at start', async () => {
      await runStatusCli();

      expect(mockConsoleLog).toHaveBeenCalledWith('TS-MCP Status\n');
    });

    describe('local mode status', () => {
      it('shows authenticated when local API key exists', async () => {
        // Setup: local API key exists in keychain
        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'touchstone-api-key') {
            return 'local-api-key';
          }
          return null;
        });

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Local mode:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Status: Authenticated');
        expect(mockConsoleLog).toHaveBeenCalledWith('  API key stored in keychain');
      });

      it('shows not authenticated when no local API key', async () => {
        // Setup: no local API key
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Local mode:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Status: Not authenticated');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Run "ts-mcp auth" to authenticate');
      });
    });

    describe('cloud mode status', () => {
      it('shows no cloud servers when mcp.json does not exist', async () => {
        mockExistsSync.mockReturnValue(false);
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers: None configured');
      });

      it('shows no cloud servers when no servers have URLs', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            local: {
              command: 'node dist/index.js'
            }
          }
        }));
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers: None configured');
      });

      it('shows cloud server as not authenticated when no session token', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  touchstone:');
        expect(mockConsoleLog).toHaveBeenCalledWith('    URL: https://ts-mcp.example.com');
        expect(mockConsoleLog).toHaveBeenCalledWith('    Status: Not authenticated');
        expect(mockConsoleLog).toHaveBeenCalledWith('    Run "ts-mcp login touchstone" to authenticate');
      });

      it('shows cloud server as authenticated when session is valid', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));

        // Setup: session token exists in keychain
        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'session:https://ts-mcp.example.com') {
            return 'valid-session-token';
          }
          return null;
        });

        // Setup: server says session is valid
        const expiresAt = new Date(Date.now() + 86400000).toISOString();
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            valid: true,
            expiresAt,
            userId: 'user-123',
            user: 'dev@example.com'
          })
        } as Response);

        await runStatusCli();

        // Verify fetch was called with Bearer token
        expect(mockFetch).toHaveBeenCalledWith(
          'https://ts-mcp.example.com/auth/status',
          expect.objectContaining({
            headers: { 'Authorization': 'Bearer valid-session-token' }
          })
        );

        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  touchstone:');
        expect(mockConsoleLog).toHaveBeenCalledWith('    URL: https://ts-mcp.example.com');
        expect(mockConsoleLog).toHaveBeenCalledWith('    Status: Authenticated');
        expect(mockConsoleLog).toHaveBeenCalledWith('    User: dev@example.com');
        expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('    Expires:'));
      });

      it('shows session expired when server returns invalid', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));

        // Setup: session token exists but server says it's invalid
        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'session:https://ts-mcp.example.com') {
            return 'expired-session-token';
          }
          return null;
        });

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({ valid: false })
        } as Response);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('    Status: Session expired');
        expect(mockConsoleLog).toHaveBeenCalledWith('    Run "ts-mcp login touchstone" to re-authenticate');
      });

      it('shows session invalid when server returns non-ok response', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));

        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'session:https://ts-mcp.example.com') {
            return 'some-session-token';
          }
          return null;
        });

        mockFetch.mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ error: 'Unauthorized' })
        } as Response);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('    Status: Session invalid');
      });

      it('shows cannot reach server when fetch fails', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));

        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'session:https://ts-mcp.example.com') {
            return 'some-session-token';
          }
          return null;
        });

        mockFetch.mockRejectedValue(new Error('Network error'));

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('    Status: Cannot reach server');
      });

      it('shows status for multiple cloud servers', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            server1: {
              url: 'https://server1.example.com/mcp'
            },
            server2: {
              url: 'https://server2.example.com/mcp'
            },
            localOnly: {
              command: 'node dist/index.js'
            }
          }
        }));

        // server1 is authenticated, server2 is not
        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'session:https://server1.example.com') {
            return 'server1-token';
          }
          return null;
        });

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            valid: true,
            expiresAt: new Date(Date.now() + 86400000).toISOString()
          })
        } as Response);

        await runStatusCli();

        // Verify both servers are shown
        expect(mockConsoleLog).toHaveBeenCalledWith('  server1:');
        expect(mockConsoleLog).toHaveBeenCalledWith('    URL: https://server1.example.com');
        expect(mockConsoleLog).toHaveBeenCalledWith('  server2:');
        expect(mockConsoleLog).toHaveBeenCalledWith('    URL: https://server2.example.com');

        // Verify localOnly (no URL) is NOT shown
        const calls = mockConsoleLog.mock.calls.flat();
        expect(calls).not.toContain('  localOnly:');
      });

      it('strips /mcp path from server URL for display', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('    URL: https://ts-mcp.example.com');
      });

      it('handles invalid JSON in config file gracefully', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue('not valid json');
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        // Should show no cloud servers configured
        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers: None configured');
      });

      it('handles config file with empty mcpServers', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {}
        }));
        mockGetPassword.mockResolvedValue(null);

        await runStatusCli();

        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers: None configured');
      });
    });

    describe('combined local and cloud status', () => {
      it('shows both local authenticated and cloud authenticated', async () => {
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify({
          mcpServers: {
            touchstone: {
              url: 'https://ts-mcp.example.com/mcp'
            }
          }
        }));

        // Both local and cloud authenticated
        mockGetPassword.mockImplementation(async (service, account) => {
          if (account === 'touchstone-api-key') {
            return 'local-api-key';
          }
          if (account === 'session:https://ts-mcp.example.com') {
            return 'cloud-session-token';
          }
          return null;
        });

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            valid: true,
            expiresAt: new Date(Date.now() + 86400000).toISOString()
          })
        } as Response);

        await runStatusCli();

        // Verify local status
        expect(mockConsoleLog).toHaveBeenCalledWith('Local mode:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  Status: Authenticated');

        // Verify cloud status
        expect(mockConsoleLog).toHaveBeenCalledWith('Cloud servers:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  touchstone:');
        expect(mockConsoleLog).toHaveBeenCalledWith('    Status: Authenticated');
      });
    });
  });
});
