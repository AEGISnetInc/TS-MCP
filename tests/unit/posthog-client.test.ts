import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

// Create mock capture and shutdown functions
const mockCapture = jest.fn();
const mockShutdown = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

// Mock posthog-node BEFORE importing modules that use it
jest.unstable_mockModule('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: mockCapture,
    shutdown: mockShutdown
  }))
}));

// Import after mocks are set up
const { AnalyticsClient } = await import('../../src/analytics/posthog-client.js');
const { AnalyticsEvents } = await import('../../src/analytics/events.js');

describe('AnalyticsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates client without error', () => {
    const client = new AnalyticsClient();
    expect(client).toBeDefined();
  });

  it('can track events without throwing', () => {
    const client = new AnalyticsClient();
    expect(() => {
      client.track(AnalyticsEvents.AUTH_SUCCESS, { base_url: 'https://example.com' });
    }).not.toThrow();
  });

  describe('getInstanceId', () => {
    it('returns consistent instance ID', () => {
      const client = new AnalyticsClient();
      const id1 = client.getInstanceId();
      const id2 = client.getInstanceId();
      expect(id1).toBe(id2);
    });

    it('returns a valid UUID format', () => {
      const client = new AnalyticsClient();
      const id = client.getInstanceId();
      // UUID v4 format regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('shutdown', () => {
    it('can shutdown without error', async () => {
      const client = new AnalyticsClient();
      await expect(client.shutdown()).resolves.not.toThrow();
    });
  });
});

describe('Release verification', () => {
  it('dist should not contain PostHog placeholder', () => {
    const distPath = join(process.cwd(), 'dist/analytics/posthog-client.js');
    const distContent = readFileSync(distPath, 'utf-8');
    expect(distContent).not.toContain('__POSTHOG_API_KEY__');
  });
});
