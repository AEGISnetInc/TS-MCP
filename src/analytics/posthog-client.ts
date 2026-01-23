import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
import type { AnalyticsEvent } from './events.js';

// PostHog API key is injected at build time
// This placeholder is replaced during CI/CD build
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY ?? '__POSTHOG_API_KEY__';

export class AnalyticsClient {
  private posthog: PostHog | null = null;
  private instanceId: string;

  constructor() {
    this.instanceId = randomUUID();

    if (POSTHOG_API_KEY !== '__POSTHOG_API_KEY__') {
      this.posthog = new PostHog(POSTHOG_API_KEY, {
        host: 'https://app.posthog.com'
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
