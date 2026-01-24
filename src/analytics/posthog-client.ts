import { PostHog } from 'posthog-node';
import { randomUUID } from 'crypto';
import type { AnalyticsEvent } from './events.js';

// PostHog API key - placeholder replaced by CI/CD build via sed
const POSTHOG_API_KEY = '__POSTHOG_API_KEY__';

export class AnalyticsClient {
  private posthog: PostHog | null = null;
  private instanceId: string;
  private userEmail: string | null = null;

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
  identify(email: string): void {
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

  track(event: AnalyticsEvent, properties: Record<string, unknown>): void {
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

  getInstanceId(): string {
    return this.instanceId;
  }

  async shutdown(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}
