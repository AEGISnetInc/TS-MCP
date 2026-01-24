import type { AnalyticsEvent } from './events.js';
export declare class AnalyticsClient {
    private posthog;
    private instanceId;
    private userEmail;
    constructor();
    /**
     * Identify the user by email. All subsequent events will include this email.
     */
    identify(email: string): void;
    track(event: AnalyticsEvent, properties: Record<string, unknown>): void;
    getInstanceId(): string;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=posthog-client.d.ts.map