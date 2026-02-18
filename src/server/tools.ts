import { z } from 'zod';

export const AuthenticateInputSchema = z.object({
  username: z.string().describe('Your Touchstone username'),
  password: z.string().describe('Your Touchstone password')
});
export type AuthenticateInput = z.infer<typeof AuthenticateInputSchema>;

export const LaunchTestExecutionInputSchema = z.object({
  testSetupName: z.string().describe('Name of the Test Setup configured in Touchstone UI')
});
export type LaunchTestExecutionInput = z.infer<typeof LaunchTestExecutionInputSchema>;

export const GetTestStatusInputSchema = z.object({
  executionId: z.string().describe('The execution ID returned from launch_test_execution')
});
export type GetTestStatusInput = z.infer<typeof GetTestStatusInputSchema>;

export const GetTestResultsInputSchema = z.object({
  executionId: z.string().describe('The execution ID returned from launch_test_execution'),
  verbose: z.boolean().optional().default(false).describe('When true, fetches individual test details for all scripts including passing ones')
});
export type GetTestResultsInput = z.infer<typeof GetTestResultsInputSchema>;

export const TOOL_DEFINITIONS = [
  {
    name: 'launch_test_execution',
    description: 'Start a Touchstone test execution using a pre-configured Test Setup. Returns an execution ID for tracking.',
    inputSchema: {
      type: 'object' as const,
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
      type: 'object' as const,
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
      type: 'object' as const,
      properties: {
        executionId: { type: 'string', description: 'The execution ID returned from launch_test_execution' },
        verbose: { type: 'boolean', description: 'When true, fetches individual test details for all scripts including passing ones. Note: adds ~15 seconds per script due to API rate limits.' }
      },
      required: ['executionId']
    }
  }
] as const;
