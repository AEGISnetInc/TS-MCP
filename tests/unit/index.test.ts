import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock all dependencies BEFORE importing
const mockRunAuthCli = jest.fn<() => Promise<void>>();
const mockRunLoginCli = jest.fn<(serverName?: string) => Promise<void>>();
const mockRunLogoutCli = jest.fn<(serverName?: string) => Promise<void>>();
const mockRunStatusCli = jest.fn<() => Promise<void>>();
const mockGetConfig = jest.fn();
const mockRun = jest.fn<() => Promise<void>>();
const mockShutdown = jest.fn<() => Promise<void>>();

// Mock server constructor
const MockTSMCPServer = jest.fn().mockImplementation(() => ({
  run: mockRun,
  shutdown: mockShutdown
}));

// Mock keychain
const MockKeychainService = jest.fn();

// Mock local auth provider
const MockLocalAuthProvider = jest.fn();

jest.unstable_mockModule('../../src/cli/auth.js', () => ({
  runAuthCli: mockRunAuthCli
}));

jest.unstable_mockModule('../../src/cli/login.js', () => ({
  runLoginCli: mockRunLoginCli
}));

jest.unstable_mockModule('../../src/cli/logout.js', () => ({
  runLogoutCli: mockRunLogoutCli
}));

jest.unstable_mockModule('../../src/cli/status.js', () => ({
  runStatusCli: mockRunStatusCli
}));

jest.unstable_mockModule('../../src/utils/config.js', () => ({
  getConfig: mockGetConfig
}));

jest.unstable_mockModule('../../src/server/mcp-server.js', () => ({
  TSMCPServer: MockTSMCPServer
}));

jest.unstable_mockModule('../../src/auth/keychain.js', () => ({
  KeychainService: MockKeychainService
}));

jest.unstable_mockModule('../../src/auth/local-auth-provider.js', () => ({
  LocalAuthProvider: MockLocalAuthProvider
}));

// Import module after mocks are set up
const indexModule = await import('../../src/index.js');

describe('index.ts', () => {
  let mockConsoleLog: jest.SpiedFunction<typeof console.log>;
  let mockConsoleError: jest.SpiedFunction<typeof console.error>;
  let mockProcessExit: jest.SpiedFunction<typeof process.exit>;
  let mockProcessOn: jest.SpiedFunction<typeof process.on>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Default config for local mode
    mockGetConfig.mockReturnValue({
      mode: 'local',
      touchstoneBaseUrl: 'https://touchstone.aegis.net',
      port: 3000
    });

    // Mock console and process
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    mockProcessOn = jest.spyOn(process, 'on').mockImplementation(() => process);

    // Default mock implementations
    mockRunAuthCli.mockResolvedValue(undefined);
    mockRunLoginCli.mockResolvedValue(undefined);
    mockRunLogoutCli.mockResolvedValue(undefined);
    mockRunStatusCli.mockResolvedValue(undefined);
    mockRun.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
    mockProcessOn.mockRestore();
  });

  describe('handleCommand', () => {
    describe('command routing', () => {
      it('routes "auth" command to runAuthCli', async () => {
        await indexModule.handleCommand(['auth']);

        expect(mockRunAuthCli).toHaveBeenCalled();
      });

      it('routes "login" command to runLoginCli without server name', async () => {
        await indexModule.handleCommand(['login']);

        expect(mockRunLoginCli).toHaveBeenCalledWith(undefined);
      });

      it('routes "login <name>" command to runLoginCli with server name', async () => {
        await indexModule.handleCommand(['login', 'touchstone-prod']);

        expect(mockRunLoginCli).toHaveBeenCalledWith('touchstone-prod');
      });

      it('routes "logout" command to runLogoutCli without server name', async () => {
        await indexModule.handleCommand(['logout']);

        expect(mockRunLogoutCli).toHaveBeenCalledWith(undefined);
      });

      it('routes "logout <name>" command to runLogoutCli with server name', async () => {
        await indexModule.handleCommand(['logout', 'touchstone-prod']);

        expect(mockRunLogoutCli).toHaveBeenCalledWith('touchstone-prod');
      });

      it('routes "status" command to runStatusCli', async () => {
        await indexModule.handleCommand(['status']);

        expect(mockRunStatusCli).toHaveBeenCalled();
      });

      it('exits with error for unknown command', async () => {
        await expect(
          indexModule.handleCommand(['unknown-command'])
        ).rejects.toThrow('process.exit(1)');

        expect(mockConsoleError).toHaveBeenCalledWith('Unknown command: unknown-command');
        expect(mockConsoleError).toHaveBeenCalledWith('Run "ts-mcp --help" for usage.');
      });
    });

    describe('help output', () => {
      it('shows help for "--help" flag', async () => {
        await indexModule.handleCommand(['--help']);

        expect(mockConsoleLog).toHaveBeenCalledWith('TS-MCP - Touchstone MCP Server for Claude Code');
        expect(mockConsoleLog).toHaveBeenCalledWith('Usage: ts-mcp [command]');
        expect(mockConsoleLog).toHaveBeenCalledWith('Commands:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  auth           Authenticate for local mode (stores API key in keychain)');
        expect(mockConsoleLog).toHaveBeenCalledWith('  login [name]   Authenticate with cloud server');
        expect(mockConsoleLog).toHaveBeenCalledWith('  logout [name]  Log out from cloud server');
        expect(mockConsoleLog).toHaveBeenCalledWith('  status         Show authentication status');
        expect(mockConsoleLog).toHaveBeenCalledWith('  (none)         Start MCP server (mode determined by TS_MCP_MODE)');
      });

      it('shows help for "-h" flag', async () => {
        await indexModule.handleCommand(['-h']);

        expect(mockConsoleLog).toHaveBeenCalledWith('TS-MCP - Touchstone MCP Server for Claude Code');
      });

      it('shows environment variables in help', async () => {
        await indexModule.handleCommand(['--help']);

        expect(mockConsoleLog).toHaveBeenCalledWith('Environment:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  TS_MCP_MODE=local|cloud  Server mode (default: local)');
      });

      it('shows examples in help', async () => {
        await indexModule.handleCommand(['--help']);

        expect(mockConsoleLog).toHaveBeenCalledWith('Examples:');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ts-mcp auth              # Authenticate for local mode');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ts-mcp login             # Authenticate with cloud server');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ts-mcp login touchstone  # Authenticate with specific server');
        expect(mockConsoleLog).toHaveBeenCalledWith('  ts-mcp status            # Show auth status');
      });
    });

    describe('server mode detection', () => {
      it('starts local server when mode is "local" and no command', async () => {
        mockGetConfig.mockReturnValue({
          mode: 'local',
          touchstoneBaseUrl: 'https://touchstone.aegis.net',
          port: 3000
        });

        await indexModule.handleCommand([]);

        expect(MockTSMCPServer).toHaveBeenCalled();
        expect(mockRun).toHaveBeenCalled();
      });

      it('starts local server when TS_MCP_MODE defaults to local', async () => {
        mockGetConfig.mockReturnValue({
          mode: 'local', // default when not set
          touchstoneBaseUrl: 'https://touchstone.aegis.net',
          port: 3000
        });

        await indexModule.handleCommand([]);

        expect(MockTSMCPServer).toHaveBeenCalled();
        expect(mockRun).toHaveBeenCalled();
      });

      it('registers SIGINT handler for local server', async () => {
        mockGetConfig.mockReturnValue({
          mode: 'local',
          touchstoneBaseUrl: 'https://touchstone.aegis.net',
          port: 3000
        });

        await indexModule.handleCommand([]);

        expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      });

      it('registers SIGTERM handler for local server', async () => {
        mockGetConfig.mockReturnValue({
          mode: 'local',
          touchstoneBaseUrl: 'https://touchstone.aegis.net',
          port: 3000
        });

        await indexModule.handleCommand([]);

        expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      });
    });
  });

  describe('printHelp', () => {
    it('prints complete help message', () => {
      indexModule.printHelp();

      expect(mockConsoleLog).toHaveBeenCalledWith('TS-MCP - Touchstone MCP Server for Claude Code');
      expect(mockConsoleLog).toHaveBeenCalledWith('');
      expect(mockConsoleLog).toHaveBeenCalledWith('Usage: ts-mcp [command]');
    });
  });

  describe('runLocalServer', () => {
    it('creates server with LocalAuthProvider', async () => {
      await indexModule.runLocalServer();

      expect(MockKeychainService).toHaveBeenCalled();
      expect(MockLocalAuthProvider).toHaveBeenCalled();
      expect(MockTSMCPServer).toHaveBeenCalled();
    });

    it('starts the server', async () => {
      await indexModule.runLocalServer();

      expect(mockRun).toHaveBeenCalled();
    });

    it('registers signal handlers', async () => {
      await indexModule.runLocalServer();

      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
  });

  describe('main', () => {
    let originalArgv: string[];

    beforeEach(() => {
      originalArgv = process.argv;
    });

    afterEach(() => {
      process.argv = originalArgv;
    });

    it('reads args from process.argv and calls handleCommand', async () => {
      process.argv = ['node', 'index.js', 'status'];

      await indexModule.main();

      expect(mockRunStatusCli).toHaveBeenCalled();
    });

    it('handles auth command from process.argv', async () => {
      process.argv = ['node', 'index.js', 'auth'];

      await indexModule.main();

      expect(mockRunAuthCli).toHaveBeenCalled();
    });

    it('handles login with server name from process.argv', async () => {
      process.argv = ['node', 'index.js', 'login', 'my-server'];

      await indexModule.main();

      expect(mockRunLoginCli).toHaveBeenCalledWith('my-server');
    });
  });
});
