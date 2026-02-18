import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { RateLimiter, RATE_LIMITS } from '../touchstone/rate-limiter.js';
import { AnalyticsClient } from '../analytics/posthog-client.js';
import { AnalyticsEvents } from '../analytics/events.js';
import { getConfig } from '../utils/config.js';
import { formatErrorResponse, TSMCPError, TouchstoneApiKeyExpiredError } from '../utils/errors.js';
import { transformResults } from '../utils/result-transformer.js';
import { TOOL_DEFINITIONS, LaunchTestExecutionInputSchema, GetTestStatusInputSchema, GetTestResultsInputSchema } from './tools.js';
import { PROMPT_DEFINITIONS, getRunTestsPromptContent, getCheckResultsPromptContent } from './prompts.js';
export class TSMCPServer {
    server;
    authProvider;
    touchstoneClient;
    rateLimiter;
    analytics;
    config = getConfig();
    constructor(authProvider) {
        this.server = new Server({ name: 'ts-mcp', version: '0.1.0' }, { capabilities: { tools: {}, prompts: {} } });
        this.touchstoneClient = new TouchstoneClient(this.config.touchstoneBaseUrl);
        this.authProvider = authProvider;
        this.rateLimiter = new RateLimiter();
        this.analytics = new AnalyticsClient();
        this.setupHandlers();
        this.identifyUser();
    }
    /**
     * Identify the user for analytics if email is available.
     */
    async identifyUser() {
        try {
            if (this.authProvider.getEmail) {
                const email = await this.authProvider.getEmail();
                if (email) {
                    this.analytics.identify(email);
                }
            }
        }
        catch {
            // Ignore errors - analytics should never break the server
        }
    }
    setupHandlers() {
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
                const testSetupName = args?.testSetupName;
                return {
                    messages: [
                        {
                            role: 'user',
                            content: { type: 'text', text: getRunTestsPromptContent(testSetupName) }
                        }
                    ]
                };
            }
            if (name === 'check-results') {
                const executionId = args?.executionId;
                return {
                    messages: [
                        {
                            role: 'user',
                            content: { type: 'text', text: getCheckResultsPromptContent(executionId) }
                        }
                    ]
                };
            }
            throw new Error(`Unknown prompt: ${name}`);
        });
        // Call tool
        this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
            const { name, arguments: args } = request.params;
            // Build auth context from the SDK's authInfo (passed from HTTP transport)
            const authContext = extra.authInfo?.token
                ? { sessionToken: extra.authInfo.token }
                : undefined;
            try {
                return await this.executeToolWithAutoRefresh(name, args, authContext);
            }
            catch (error) {
                this.analytics.track(AnalyticsEvents.TOOL_ERROR, {
                    tool_name: name,
                    error_code: error instanceof TSMCPError ? error.code : 'UNKNOWN_ERROR',
                    error_message: error instanceof Error ? error.message : 'Unknown error'
                });
                const errorResponse = formatErrorResponse(error);
                return {
                    content: [{ type: 'text', text: JSON.stringify(errorResponse, null, 2) }],
                    isError: true
                };
            }
        });
    }
    /**
     * Execute a tool with automatic API key refresh on expiration.
     */
    async executeToolWithAutoRefresh(name, args, authContext) {
        try {
            return await this.executeTool(name, args, authContext);
        }
        catch (error) {
            // If API key expired, try to refresh and retry
            if (error instanceof TouchstoneApiKeyExpiredError) {
                const refreshed = await this.tryRefreshApiKey();
                if (refreshed) {
                    // Retry the operation with the new API key
                    return await this.executeTool(name, args, authContext);
                }
            }
            throw error;
        }
    }
    /**
     * Try to refresh the API key using stored credentials.
     */
    async tryRefreshApiKey() {
        // Check if auth provider supports refresh (duck typing)
        const provider = this.authProvider;
        if (typeof provider.refreshApiKey !== 'function') {
            return false;
        }
        try {
            const newApiKey = await provider.refreshApiKey();
            return newApiKey !== null;
        }
        catch {
            return false;
        }
    }
    /**
     * Execute a tool by name.
     */
    async executeTool(name, args, authContext) {
        switch (name) {
            case 'launch_test_execution':
                return await this.handleLaunchExecution(args, authContext);
            case 'get_test_status':
                return await this.handleGetStatus(args, authContext);
            case 'get_test_results':
                return await this.handleGetResults(args, authContext);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async handleLaunchExecution(args, authContext) {
        const { testSetupName } = LaunchTestExecutionInputSchema.parse(args);
        const apiKey = await this.authProvider.getApiKey(authContext);
        const executionId = await this.touchstoneClient.launchExecution(apiKey, testSetupName);
        this.analytics.track(AnalyticsEvents.TEST_LAUNCHED, {
            base_url: this.config.touchstoneBaseUrl
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify({ executionId, status: 'Launched' }, null, 2)
                }]
        };
    }
    async handleGetStatus(args, authContext) {
        const { executionId } = GetTestStatusInputSchema.parse(args);
        const apiKey = await this.authProvider.getApiKey(authContext);
        await this.rateLimiter.throttle('status', RATE_LIMITS.STATUS_ENDPOINT);
        const status = await this.touchstoneClient.getExecutionStatus(apiKey, executionId);
        this.analytics.track(AnalyticsEvents.TEST_POLL, {
            execution_id: executionId,
            status: status.status
        });
        // Build response with special handling for "Waiting for Request" status
        const response = {
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
                    type: 'text',
                    text: JSON.stringify(response, null, 2)
                }]
        };
    }
    async handleGetResults(args, authContext) {
        const { executionId, verbose } = GetTestResultsInputSchema.parse(args);
        const apiKey = await this.authProvider.getApiKey(authContext);
        // Fetch execution detail (summary of all scripts)
        await this.rateLimiter.throttle('detail', RATE_LIMITS.DETAIL_ENDPOINT);
        const detail = await this.touchstoneClient.getExecutionDetail(apiKey, executionId);
        // Fetch script details for non-passing scripts to get assertion-level info
        const scriptDetails = new Map();
        const scriptExecutions = detail.testScriptExecutions ?? [];
        for (const script of scriptExecutions) {
            const needsDetails = verbose || (script.status !== 'Passed' && script.status !== 'PassedWithWarnings');
            if (needsDetails) {
                await this.rateLimiter.throttle('scriptDetail', RATE_LIMITS.SCRIPT_DETAIL_ENDPOINT);
                const scriptDetail = await this.touchstoneClient.getScriptDetail(apiKey, executionId, script.testScript);
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
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
        };
    }
    /**
     * Connects the MCP server to an external transport.
     */
    connectTransport(transport) {
        this.server.connect(transport);
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
    }
    async shutdown() {
        await this.analytics.shutdown();
        await this.server.close();
    }
}
//# sourceMappingURL=mcp-server.js.map