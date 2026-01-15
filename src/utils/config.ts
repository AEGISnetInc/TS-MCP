export interface Config {
  touchstoneBaseUrl: string;
  telemetryEnabled: boolean;
}

export function getConfig(): Config {
  return {
    touchstoneBaseUrl: process.env.TOUCHSTONE_BASE_URL ?? 'https://touchstone.aegis.net',
    telemetryEnabled: process.env.TS_MCP_TELEMETRY !== 'false'
  };
}
