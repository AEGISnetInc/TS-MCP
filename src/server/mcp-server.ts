import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { LocalAuthProvider } from '../auth/local-auth-provider.js';
import { KeychainService } from '../auth/keychain.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { RateLimiter, RATE_LIMITS } from '../touchstone/rate-limiter.js';
import { AnalyticsClient } from '../analytics/posthog-client.js';
import { AnalyticsEvents } from '../analytics/events.js';
import { getConfig } from '../utils/config.js';
import { formatErrorResponse, TSMCPError } from '../utils/errors.js';
import { transformResults } from '../utils/result-transformer.js';
import {
  TOOL_DEFINITIONS,
  LaunchTestExecutionInputSchema,
  GetTestStatusInputSchema,
  GetTestResultsInputSchema
} from './tools.js';
import {
  PROMPT_DEFINITIONS,
  getRunTestsPromptContent,
  getCheckResultsPromptContent
} from './prompts.js';

export class TSMCPServer {
  private server: Server;
  private authProvider: LocalAuthProvider;
  private touchstoneClient: TouchstoneClient;
  private rateLimiter: RateLimiter;
  private analytics: AnalyticsClient;
  private config = getConfig();

  constructor() {
    this.server = new Server(
      { name: 'ts-mcp', version: '0.1.0' },
      { capabilities: { tools: {}, prompts: {} } }
    );

    this.touchstoneClient = new TouchstoneClient(this.config.touchstoneBaseUrl);
    this.authProvider = new LocalAuthProvider(new KeychainService());
    this.rateLimiter = new RateLimiter();
    this.analytics = new AnalyticsClient(this.config.telemetryEnabled);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS
    }));

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: PROMPT_DEFINITIONS
    }));

    // Get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'run-tests') {
        const testSetupName = args?.testSetupName as string;
        return {
          messages: [
            {
              role: 'user' as const,
              content: { type: 'text' as const, text: getRunTestsPromptContent(testSetupName) }
            }
          ]
        };
      }

      if (name === 'check-results') {
        const executionId = args?.executionId as string;
        return {
          messages: [
            {
              role: 'user' as const,
              content: { type: 'text' as const, text: getCheckResultsPromptContent(executionId) }
            }
          ]
        };
      }

      throw new Error(`Unknown prompt: ${name}`);
    });

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'launch_test_execution':
            return await this.handleLaunchExecution(args);
          case 'get_test_status':
            return await this.handleGetStatus(args);
          case 'get_test_results':
            return await this.handleGetResults(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.analytics.track(AnalyticsEvents.TOOL_ERROR, {
          tool_name: name,
          error_code: error instanceof TSMCPError ? error.code : 'UNKNOWN_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });

        const errorResponse = formatErrorResponse(error);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(errorResponse, null, 2) }],
          isError: true
        };
      }
    });
  }

  private async handleLaunchExecution(args: unknown) {
    const { testSetupName } = LaunchTestExecutionInputSchema.parse(args);
    const apiKey = await this.authProvider.getApiKey();
    const executionId = await this.touchstoneClient.launchExecution(apiKey, testSetupName);

    this.analytics.track(AnalyticsEvents.TEST_LAUNCHED, {
      base_url: this.config.touchstoneBaseUrl
    });

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ executionId, status: 'Launched' }, null, 2)
      }]
    };
  }

  private async handleGetStatus(args: unknown) {
    const { executionId } = GetTestStatusInputSchema.parse(args);
    const apiKey = await this.authProvider.getApiKey();

    await this.rateLimiter.throttle('status', RATE_LIMITS.STATUS_ENDPOINT);
    const status = await this.touchstoneClient.getExecutionStatus(apiKey, executionId);

    this.analytics.track(AnalyticsEvents.TEST_POLL, {
      execution_id: executionId,
      status: status.status
    });

    // Build response with special handling for "Waiting for Request" status
    const response: Record<string, unknown> = {
      executionId,
      status: status.status
    };

    if (status.message) {
      response.message = status.message;
    }

    if (status.status === 'Waiting for Request') {
      response.action_required = 'This is a client-initiated test. Your FHIR server needs to send requests to Touchstone.';
      response.instructions = [
        'Open the Touchstone UI and navigate to this Test Execution',
        'Find the "Endpoint URL" and "USER_KEY" values for this test',
        'Configure your FHIR server to send requests to the provided endpoint URL',
        'Include the USER_KEY in request headers as specified by Touchstone',
        'Once your server sends the required requests, check the status again'
      ];
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(response, null, 2)
      }]
    };
  }

  private async handleGetResults(args: unknown) {
    const { executionId } = GetTestResultsInputSchema.parse(args);
    const apiKey = await this.authProvider.getApiKey();

    // Fetch execution detail (summary of all scripts)
    await this.rateLimiter.throttle('detail', RATE_LIMITS.DETAIL_ENDPOINT);
    const detail = await this.touchstoneClient.getExecutionDetail(apiKey, executionId);

    // Fetch script details for non-passing scripts to get assertion-level info
    const scriptDetails = new Map<string, import('../touchstone/types.js').ScriptExecDetailResponse>();
    const scriptExecutions = detail.testScriptExecutions ?? [];

    for (const script of scriptExecutions) {
      const needsDetails = script.status !== 'Passed' && script.status !== 'PassedWithWarnings';
      if (needsDetails) {
        await this.rateLimiter.throttle('scriptDetail', RATE_LIMITS.SCRIPT_DETAIL_ENDPOINT);
        const scriptDetail = await this.touchstoneClient.getScriptDetail(
          apiKey,
          executionId,
          script.testScript
        );
        scriptDetails.set(script.testScript, scriptDetail);
      }
    }

    const results = transformResults(detail, scriptDetails);

    this.analytics.track(AnalyticsEvents.TEST_COMPLETED, {
      execution_id: executionId,
      status: results.status,
      duration_ms: 0, // Would need to track start time to calculate
      passed_count: results.summary.passed,
      failed_count: results.summary.failed
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }]
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async shutdown(): Promise<void> {
    await this.analytics.shutdown();
    await this.server.close();
  }
}
