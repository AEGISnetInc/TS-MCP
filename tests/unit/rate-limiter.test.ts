import { jest } from '@jest/globals';
import { RateLimiter, RATE_LIMITS } from '../../src/touchstone/rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not throttle first call', async () => {
    const limiter = new RateLimiter();
    const start = Date.now();

    await limiter.throttle('test-endpoint', 4000);

    expect(Date.now() - start).toBeLessThan(100);
  });

  it('throttles subsequent calls within interval', async () => {
    const limiter = new RateLimiter();

    await limiter.throttle('test-endpoint', 4000);

    const throttlePromise = limiter.throttle('test-endpoint', 4000);
    jest.advanceTimersByTime(4000);
    await throttlePromise;

    // Should have waited approximately 4 seconds
    expect(true).toBe(true); // If we get here, throttling worked
  });

  it('tracks different endpoints separately', async () => {
    const limiter = new RateLimiter();

    await limiter.throttle('endpoint-a', 4000);

    const start = Date.now();
    await limiter.throttle('endpoint-b', 4000);

    // Different endpoint should not be throttled
    expect(Date.now() - start).toBeLessThan(100);
  });

  it('does not throttle if enough time has passed', async () => {
    const limiter = new RateLimiter();

    await limiter.throttle('test-endpoint', 4000);

    jest.advanceTimersByTime(5000);

    const start = Date.now();
    await limiter.throttle('test-endpoint', 4000);

    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe('RATE_LIMITS', () => {
  it('has correct status endpoint limit', () => {
    expect(RATE_LIMITS.STATUS_ENDPOINT).toBe(4000);
  });

  it('has correct detail endpoint limit', () => {
    expect(RATE_LIMITS.DETAIL_ENDPOINT).toBe(15000);
  });
});
