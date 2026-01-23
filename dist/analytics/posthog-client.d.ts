import type { AnalyticsEvent } from './events.js';
export declare class AnalyticsClient {
    private readonly enabled;
    private posthog;
    private instanceId;
    constructor(enabled: boolean);
    track(event: AnalyticsEvent, properties: Record<string, unknown>): void;
    getInstanceId(): string;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=posthog-client.d.ts.map