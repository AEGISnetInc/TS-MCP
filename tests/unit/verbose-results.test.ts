import { jest } from '@jest/globals';

// Mock dependencies BEFORE importing modules that use them
const mockGetApiKey = jest.fn<() => Promise<string>>().mockResolvedValue('test-api-key');
const mockGetExecutionDetail = jest.fn<(...args: any[]) => Promise<any>>();
const mockGetScriptDetail = jest.fn<(...args: any[]) => Promise<any>>();
const mockThrottle = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockTrack = jest.fn();
const mockShutdown = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockIdentify = jest.fn();

jest.unstable_mockModule('../../src/touchstone/client.js', () => ({
  TouchstoneClient: jest.fn().mockImplementation(() => ({
    getExecutionDetail: mockGetExecutionDetail,
    getScriptDetail: mockGetScriptDetail
  }))
}));

jest.unstable_mockModule('../../src/touchstone/rate-limiter.js', () => ({
  RateLimiter: jest.fn().mockImplementation(() => ({
    throttle: mockThrottle
  })),
  RATE_LIMITS: {
    STATUS_ENDPOINT: 4000,
    DETAIL_ENDPOINT: 15000,
    SCRIPT_DETAIL_ENDPOINT: 15000
  }
}));

jest.unstable_mockModule('../../src/analytics/posthog-client.js', () => ({
  AnalyticsClient: jest.fn().mockImplementation(() => ({
    track: mockTrack,
    shutdown: mockShutdown,
    identify: mockIdentify
  }))
}));

jest.unstable_mockModule('../../src/utils/config.js', () => ({
  getConfig: () => ({ touchstoneBaseUrl: 'https://test.example.com' })
}));

// Import AFTER mocks are set up
const { TSMCPServer } = await import('../../src/server/mcp-server.js');

// Helper to build an execution detail response with passing scripts
function makePassingExecDetail() {
  return {
    testExecId: 12345,
    status: 'Passed' as const,
    testScriptExecutions: [
      {
        testScript: '/FHIR4-0-1/Patient/Client/Patient-client-id-json',
        status: 'Passed' as const,
        statusCounts: {
          numberOfTests: 7,
          numberOfTestPasses: 7,
          numberOfTestFailures: 0
        }
      },
      {
        testScript: '/FHIR4-0-1/Patient/Server/Patient-server-id-json',
        status: 'Passed' as const,
        statusCounts: {
          numberOfTests: 7,
          numberOfTestPasses: 7,
          numberOfTestFailures: 0
        }
      }
    ]
  };
}

function makeScriptDetail(scriptPath: string) {
  return {
    status: 'Passed' as const,
    testScript: scriptPath,
    testItemExecutions: [
      {
        name: 'Create Patient',
        status: 'Passed',
        operationExecutions: [
          { assertionExecutions: [{ status: 'Passed', summary: 'Response is 201' }] }
        ]
      },
      {
        name: 'Read Patient',
        status: 'Passed',
        operationExecutions: [
          { assertionExecutions: [{ status: 'Passed', summary: 'Response is 200' }] }
        ]
      }
    ]
  };
}

describe('get_test_results verbose option', () => {
  let server: InstanceType<typeof TSMCPServer>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExecutionDetail.mockResolvedValue(makePassingExecDetail());
    mockGetScriptDetail.mockImplementation((_apiKey: string, _execId: string, scriptPath: string) =>
      Promise.resolve(makeScriptDetail(scriptPath))
    );

    const mockAuthProvider = {
      getApiKey: mockGetApiKey
    };
    server = new TSMCPServer(mockAuthProvider as any);
  });

  test('without verbose, does not fetch script details for passing scripts', async () => {
    // Call the tool handler via the server's internal method
    // We need to trigger the CallTool handler with get_test_results
    const result = await callGetTestResults(server, { executionId: '12345' });

    const parsed = JSON.parse(result);
    // Script details should NOT be fetched for passing scripts
    expect(mockGetScriptDetail).not.toHaveBeenCalled();
    // Tests array should be empty since no details were fetched
    expect(parsed.scripts[0].tests).toEqual([]);
    expect(parsed.scripts[1].tests).toEqual([]);
  });

  test('with verbose: true, fetches script details for all scripts including passing', async () => {
    const result = await callGetTestResults(server, { executionId: '12345', verbose: true });

    const parsed = JSON.parse(result);
    // Script details SHOULD be fetched for all scripts
    expect(mockGetScriptDetail).toHaveBeenCalledTimes(2);
    // Tests array should be populated
    expect(parsed.scripts[0].tests.length).toBeGreaterThan(0);
    expect(parsed.scripts[1].tests.length).toBeGreaterThan(0);
    expect(parsed.scripts[0].tests[0].name).toBe('Create Patient');
  });

  test('with verbose: false explicit, behaves same as default', async () => {
    const result = await callGetTestResults(server, { executionId: '12345', verbose: false });

    const parsed = JSON.parse(result);
    expect(mockGetScriptDetail).not.toHaveBeenCalled();
    expect(parsed.scripts[0].tests).toEqual([]);
  });
});

/**
 * Helper to invoke the get_test_results tool handler through the MCP server.
 * Uses the server's internal executeTool method via CallToolRequest simulation.
 */
async function callGetTestResults(
  server: any,
  args: { executionId: string; verbose?: boolean }
): Promise<string> {
  // Access the private executeTool method
  const result = await server.executeTool('get_test_results', args);
  return result.content[0].text;
}
