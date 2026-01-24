import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
// PostHog API key - placeholder replaced by CI/CD build via sed
const POSTHOG_API_KEY = 'phc_PwBTjHa06k5Hrq6If5nBjWLeCOUuLeJja26VwBxrCYK';
export class AnalyticsClient {
    posthog = null;
    instanceId;
    userEmail = null;
    constructor() {
        this.instanceId = randomUUID();
        // PostHog keys start with 'phc_' - check this instead of placeholder
        // (sed replaces all occurrences of placeholder, breaking !== check)
        if (POSTHOG_API_KEY.startsWith('phc_')) {
            this.posthog = new PostHog(POSTHOG_API_KEY, {
                host: 'https://us.i.posthog.com'
            });
        }
    }
    /**
     * Identify the user by email. All subsequent events will include this email.
     */
    identify(email) {
        this.userEmail = email;
        if (this.posthog) {
            // Link this instance to the user in PostHog
            this.posthog.identify({
                distinctId: email,
                properties: {
                    email,
                    instance_id: this.instanceId
                }
            });
        }
    }
    track(event, properties) {
        if (!this.posthog) {
            return;
        }
        // Use email as distinctId if identified, otherwise instance ID
        const distinctId = this.userEmail ?? this.instanceId;
        this.posthog.capture({
            distinctId,
            event,
            properties: {
                ...properties,
                instance_id: this.instanceId,
                ...(this.userEmail && { user_email: this.userEmail })
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