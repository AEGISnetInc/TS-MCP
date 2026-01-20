// tests/integration/http-server.test.ts
import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('HTTP Server', () => {
  beforeAll(async () => {
    // Set required env vars
    process.env.TS_MCP_MODE = 'cloud';
    process.env.TS_MCP_ENCRYPTION_KEY = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
    process.env.DATABASE_URL = 'postgres://test:test@localhost/testdb';
  });

  afterAll(async () => {
    delete process.env.TS_MCP_MODE;
    delete process.env.TS_MCP_ENCRYPTION_KEY;
    delete process.env.DATABASE_URL;
  });

  it('exports createHttpServer function', async () => {
    // Just verify the module can be imported and exports the expected function
    const module = await import('../../src/server/http-server.js');
    expect(module.createHttpServer).toBeDefined();
    expect(typeof module.createHttpServer).toBe('function');
  });
});
