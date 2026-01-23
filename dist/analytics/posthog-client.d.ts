import type { AnalyticsEvent } from './events.js';
export declare class AnalyticsClient {
    private posthog;
    private instanceId;
    constructor();
    track(event: AnalyticsEvent, properties: Record<string, unknown>): void;
    getInstanceId(): string;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=posthog-client.d.ts.map