export interface Config {
    mode: 'local' | 'cloud';
    touchstoneBaseUrl: string;
    telemetryEnabled: boolean;
    databaseUrl?: string;
    sessionTtlDays: number;
    port: number;
}
export declare function getConfig(): Config;
//# sourceMappingURL=config.d.ts.map