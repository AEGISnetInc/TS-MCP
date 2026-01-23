// tests/unit/cli-serve.test.ts
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the server modules
const mockRunProxyServer = jest.fn<(cloudUrl?: string) => Promise<void>>();
const mockRunLocalServer = jest.fn<() => Promise<void>>();

jest.unstable_mockModule('../../src/server/proxy-server.js', () => ({
  runProxyServer: mockRunProxyServer
}));

jest.unstable_mockModule('../../src/index.js', () => ({
  runLocalServer: mockRunLocalServer
}));

describe('runServeCli', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('runs proxy server when cloud option is true', async () => {
    const { runServeCli } = await import('../../src/cli/serve.js');

    await runServeCli({ cloud: true });

    expect(mockRunProxyServer).toHaveBeenCalledWith(undefined);
    expect(mockRunLocalServer).not.toHaveBeenCalled();
  });

  it('passes cloudUrl to proxy server', async () => {
    const { runServeCli } = await import('../../src/cli/serve.js');

    await runServeCli({ cloud: true, cloudUrl: 'https://custom.example.com/mcp' });

    expect(mockRunProxyServer).toHaveBeenCalledWith('https://custom.example.com/mcp');
  });

  it('runs local server when cloud option is false', async () => {
    const { runServeCli } = await import('../../src/cli/serve.js');

    await runServeCli({ cloud: false });

    expect(mockRunLocalServer).toHaveBeenCalled();
    expect(mockRunProxyServer).not.toHaveBeenCalled();
  });

  it('runs local server when cloud option is undefined', async () => {
    const { runServeCli } = await import('../../src/cli/serve.js');

    await runServeCli({});

    expect(mockRunLocalServer).toHaveBeenCalled();
    expect(mockRunProxyServer).not.toHaveBeenCalled();
  });
});
