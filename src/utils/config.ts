export interface Config {
  mode: 'local' | 'cloud';
  touchstoneBaseUrl: string;
  telemetryEnabled: boolean;
  databaseUrl?: string;
  sessionTtlDays: number;
  port: number;
}

export function getConfig(): Config {
  return {
    mode: (process.env.TS_MCP_MODE as 'local' | 'cloud') ?? 'local',
    touchstoneBaseUrl: process.env.TOUCHSTONE_BASE_URL ?? 'https://touchstone.aegis.net',
    telemetryEnabled: process.env.TS_MCP_TELEMETRY !== 'false',
    databaseUrl: process.env.DATABASE_URL,
    sessionTtlDays: parseInt(process.env.TS_MCP_SESSION_TTL_DAYS ?? '30', 10),
    port: parseInt(process.env.PORT ?? '3000', 10)
  };
}
