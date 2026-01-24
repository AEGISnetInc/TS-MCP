import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
import type { AnalyticsEvent } from './events.js';

// PostHog API key - placeholder replaced by CI/CD build via sed
const POSTHOG_API_KEY = '__POSTHOG_API_KEY__';

export class AnalyticsClient {
  private posthog: PostHog | null = null;
  private instanceId: string;

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

  track(event: AnalyticsEvent, properties: Record<string, unknown>): void {
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

  getInstanceId(): string {
    return this.instanceId;
  }

  async shutdown(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}
