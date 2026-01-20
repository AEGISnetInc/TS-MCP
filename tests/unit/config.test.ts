import { getConfig } from '../../src/utils/config.js';

describe('getConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns default touchstone base URL when not set', () => {
    delete process.env.TOUCHSTONE_BASE_URL;
    const config = getConfig();
    expect(config.touchstoneBaseUrl).toBe('https://touchstone.aegis.net');
  });

  it('uses custom touchstone base URL when set', () => {
    process.env.TOUCHSTONE_BASE_URL = 'https://custom.example.com';
    const config = getConfig();
    expect(config.touchstoneBaseUrl).toBe('https://custom.example.com');
  });

  it('enables telemetry by default', () => {
    delete process.env.TS_MCP_TELEMETRY;
    const config = getConfig();
    expect(config.telemetryEnabled).toBe(true);
  });

  it('disables telemetry when set to false', () => {
    process.env.TS_MCP_TELEMETRY = 'false';
    const config = getConfig();
    expect(config.telemetryEnabled).toBe(false);
  });

  describe('cloud mode config', () => {
    it('returns mode as local by default', () => {
      delete process.env.TS_MCP_MODE;
      const config = getConfig();
      expect(config.mode).toBe('local');
    });

    it('returns mode as cloud when set', () => {
      process.env.TS_MCP_MODE = 'cloud';
      const config = getConfig();
      expect(config.mode).toBe('cloud');
    });

    it('returns database URL when set', () => {
      process.env.DATABASE_URL = 'postgres://localhost/test';
      const config = getConfig();
      expect(config.databaseUrl).toBe('postgres://localhost/test');
    });

    it('returns session TTL with default', () => {
      delete process.env.TS_MCP_SESSION_TTL_DAYS;
      const config = getConfig();
      expect(config.sessionTtlDays).toBe(30);
    });

    it('returns custom session TTL when set', () => {
      process.env.TS_MCP_SESSION_TTL_DAYS = '7';
      const config = getConfig();
      expect(config.sessionTtlDays).toBe(7);
    });

    it('returns port with default', () => {
      delete process.env.PORT;
      const config = getConfig();
      expect(config.port).toBe(3000);
    });

    it('returns custom port when set', () => {
      process.env.PORT = '8080';
      const config = getConfig();
      expect(config.port).toBe(8080);
    });
  });
});
