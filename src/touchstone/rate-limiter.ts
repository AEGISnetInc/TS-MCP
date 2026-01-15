function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RateLimiter {
  private lastCall: Map<string, number> = new Map();

  async throttle(endpoint: string, minIntervalMs: number): Promise<void> {
    const now = Date.now();
    const last = this.lastCall.get(endpoint) ?? 0;
    const elapsed = now - last;

    if (elapsed < minIntervalMs) {
      await sleep(minIntervalMs - elapsed);
    }

    this.lastCall.set(endpoint, Date.now());
  }
}

// Constants for Touchstone API rate limits
export const RATE_LIMITS = {
  STATUS_ENDPOINT: 4000,    // 4 seconds
  DETAIL_ENDPOINT: 15000    // 15 seconds
} as const;
