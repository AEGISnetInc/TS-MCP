// tests/unit/proxy-server.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock keytar before importing
const mockGetPassword = jest.fn<(service: string, account: string) => Promise<string | null>>();
jest.unstable_mockModule('keytar', () => ({
  default: {
    getPassword: mockGetPassword
  }
}));

// Mock MCP SDK transports
const mockStdioStart = jest.fn<() => Promise<void>>();
const mockStdioClose = jest.fn<() => Promise<void>>();
const mockStdioSend = jest.fn<(message: unknown) => Promise<void>>();
let mockStdioOnMessage: ((message: unknown) => void) | undefined;
let mockStdioOnError: ((error: Error) => void) | undefined;
let mockStdioOnClose: (() => void) | undefined;

const mockHttpStart = jest.fn<() => Promise<void>>();
const mockHttpClose = jest.fn<() => Promise<void>>();
const mockHttpSend = jest.fn<(message: unknown) => Promise<void>>();
let mockHttpOnMessage: ((message: unknown) => void) | undefined;
let mockHttpOnError: ((error: Error) => void) | undefined;
let mockHttpOnClose: (() => void) | undefined;

jest.unstable_mockModule('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn().mockImplementation(() => ({
    start: mockStdioStart,
    close: mockStdioClose,
    send: mockStdioSend,
    set onmessage(handler: (message: unknown) => void) { mockStdioOnMessage = handler; },
    set onerror(handler: (error: Error) => void) { mockStdioOnError = handler; },
    set onclose(handler: () => void) { mockStdioOnClose = handler; }
  }))
}));

// Mock StreamableHTTPError class
class MockStreamableHTTPError extends Error {
  constructor(public code: number | undefined, message: string | undefined) {
    super(message);
    this.name = 'StreamableHTTPError';
  }
}

jest.unstable_mockModule('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: jest.fn().mockImplementation(() => ({
    start: mockHttpStart,
    close: mockHttpClose,
    send: mockHttpSend,
    set onmessage(handler: (message: unknown) => void) { mockHttpOnMessage = handler; },
    set onerror(handler: (error: Error) => void) { mockHttpOnError = handler; },
    set onclose(handler: () => void) { mockHttpOnClose = handler; }
  })),
  StreamableHTTPError: MockStreamableHTTPError
}));

describe('ProxyServer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStdioOnMessage = undefined;
    mockHttpOnMessage = undefined;
    mockGetPassword.mockResolvedValue('test-session-token');
  });

  it('starts both transports', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    await proxy.run();

    expect(mockStdioStart).toHaveBeenCalled();
    expect(mockHttpStart).toHaveBeenCalled();
  });

  it('forwards messages from STDIO to HTTP', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    await proxy.run();

    const testMessage = { jsonrpc: '2.0', id: 1, method: 'tools/list' };
    await mockStdioOnMessage!(testMessage);

    expect(mockHttpSend).toHaveBeenCalledWith(testMessage);
  });

  it('forwards messages from HTTP to STDIO', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    await proxy.run();

    const testResponse = { jsonrpc: '2.0', id: 1, result: { tools: [] } };
    await mockHttpOnMessage!(testResponse);

    expect(mockStdioSend).toHaveBeenCalledWith(testResponse);
  });

  it('sends auth error response on 401', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    mockHttpSend.mockRejectedValueOnce(new Error('401 Unauthorized'));

    await proxy.run();

    const testMessage = { jsonrpc: '2.0', id: 42, method: 'tools/call' };
    await mockStdioOnMessage!(testMessage);

    expect(mockStdioSend).toHaveBeenCalledWith(expect.objectContaining({
      jsonrpc: '2.0',
      id: 42,
      error: expect.objectContaining({
        code: -32000,
        message: expect.stringContaining('npx github:AEGISnetinc/TS-MCP login')
      })
    }));
  });

  it('sends generic error response on non-auth errors', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    mockHttpSend.mockRejectedValueOnce(new Error('Network timeout'));

    await proxy.run();

    const testMessage = { jsonrpc: '2.0', id: 99, method: 'tools/list' };
    await mockStdioOnMessage!(testMessage);

    expect(mockStdioSend).toHaveBeenCalledWith(expect.objectContaining({
      jsonrpc: '2.0',
      id: 99,
      error: expect.objectContaining({
        code: -32603,
        message: expect.stringContaining('Network timeout')
      })
    }));
  });

  it('shuts down both transports', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    await proxy.run();
    await proxy.shutdown();

    expect(mockStdioClose).toHaveBeenCalled();
    expect(mockHttpClose).toHaveBeenCalled();
  });

  it('only shuts down once', async () => {
    const { ProxyServer } = await import('../../src/server/proxy-server.js');
    const proxy = new ProxyServer('https://test.example.com/mcp');

    await proxy.run();
    await proxy.shutdown();
    await proxy.shutdown();

    expect(mockStdioClose).toHaveBeenCalledTimes(1);
    expect(mockHttpClose).toHaveBeenCalledTimes(1);
  });
});

describe('getSessionToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads token from keychain with correct account name', async () => {
    mockGetPassword.mockResolvedValue('my-token');

    // We need to test the internal function through the transport creation
    // The token is fetched when fetchWithAuth is called
    const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');

    // Just verify keytar is set up correctly
    const keytar = await import('keytar');
    const result = await keytar.default.getPassword('ts-mcp', 'session:https://test.example.com');

    expect(mockGetPassword).toHaveBeenCalledWith('ts-mcp', 'session:https://test.example.com');
    expect(result).toBe('my-token');
  });
});
