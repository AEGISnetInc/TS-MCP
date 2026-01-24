import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
// PostHog API key - placeholder replaced by CI/CD build via sed
const POSTHOG_API_KEY = 'phc_PwBTjHa06k5Hrq6If5nBjWLeCOUuLeJja26VwBxrCYK';
export class AnalyticsClient {
    posthog = null;
    instanceId;
    constructor() {
        this.instanceId = randomUUID();
        if (POSTHOG_API_KEY !== 'phc_PwBTjHa06k5Hrq6If5nBjWLeCOUuLeJja26VwBxrCYK') {
            this.posthog = new PostHog(POSTHOG_API_KEY, {
                host: 'https://app.posthog.com'
            });
        }
    }
    track(event, properties) {
        if (!this.posthog) {
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