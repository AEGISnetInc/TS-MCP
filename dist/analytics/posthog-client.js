import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
// PostHog API key is injected at build time
// This placeholder is replaced during CI/CD build
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? '__POSTHOG_API_KEY__';
export class AnalyticsClient {
    enabled;
    posthog = null;
    instanceId;
    constructor(enabled) {
        this.enabled = enabled;
        this.instanceId = randomUUID();
        if (enabled && POSTHOG_API_KEY !== '__POSTHOG_API_KEY__') {
            this.posthog = new PostHog(POSTHOG_API_KEY, {
                host: 'https://app.posthog.com'
            });
        }
    }
    track(event, properties) {
        if (!this.enabled || !this.posthog) {
            return;
        }
        this.posthog.capture({
            distinctId: this.instanceId,
            event,
            properties: {
                ...properties,
                instance_id: this.instanceId
            }
        });
    }
    getInstanceId() {
        return this.instanceId;
    }
    async shutdown() {
        if (this.posthog) {
            await this.posthog.shutdown();
        }
    }
}
//# sourceMappingURL=posthog-client.js.map