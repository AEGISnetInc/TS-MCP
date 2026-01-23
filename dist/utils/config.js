export function getConfig() {
    return {
        mode: process.env.TS_MCP_MODE ?? 'local',
        touchstoneBaseUrl: process.env.TOUCHSTONE_BASE_URL ?? 'https://touchstone.aegis.net',
        telemetryEnabled: process.env.TS_MCP_TELEMETRY !== 'false',
        databaseUrl: process.env.DATABASE_URL,
        sessionTtlDays: parseInt(process.env.TS_MCP_SESSION_TTL_DAYS ?? '30', 10),
        port: parseInt(process.env.PORT ?? '3000', 10)
    };
}
//# sourceMappingURL=config.js.map