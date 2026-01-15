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
});
