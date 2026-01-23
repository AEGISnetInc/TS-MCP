import { z } from 'zod';
export const AuthenticateInputSchema = z.object({
    username: z.string().describe('Your Touchstone username'),
    password: z.string().describe('Your Touchstone password')
});
export const LaunchTestExecutionInputSchema = z.object({
    testSetupName: z.string().describe('Name of the Test Setup configured in Touchstone UI')
});
export const GetTestStatusInputSchema = z.object({
    executionId: z.string().describe('The execution ID returned from launch_test_execution')
});
export const GetTestResultsInputSchema = z.object({
    executionId: z.string().describe('The execution ID returned from launch_test_execution')
});
export const TOOL_DEFINITIONS = [
    {
        name: 'launch_test_execution',
        description: 'Start a Touchstone test execution using a pre-configured Test Setup. Returns an execution ID for tracking.',
        inputSchema: {
            type: 'object',
            properties: {
                testSetupName: { type: 'string', description: 'Name of the Test Setup configured in Touchstone UI' }
            },
            required: ['testSetupName']
        }
    },
    {
        name: 'get_test_status',
        description: 'Check the current status of a test execution.',
        inputSchema: {
            type: 'object',
            properties: {
                executionId: { type: 'string', description: 'The execution ID returned from launch_test_execution' }
            },
            required: ['executionId']
        }
    },
    {
        name: 'get_test_results',
        description: 'Retrieve detailed results for a completed test execution, including passed tests and failure details.',
        inputSchema: {
            type: 'object',
            properties: {
                executionId: { type: 'string', description: 'The execution ID returned from launch_test_execution' }
            },
            required: ['executionId']
        }
    }
];
//# sourceMappingURL=tools.js.map