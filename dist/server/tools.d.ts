import { z } from 'zod';
export declare const AuthenticateInputSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type AuthenticateInput = z.infer<typeof AuthenticateInputSchema>;
export declare const LaunchTestExecutionInputSchema: z.ZodObject<{
    testSetupName: z.ZodString;
}, z.core.$strip>;
export type LaunchTestExecutionInput = z.infer<typeof LaunchTestExecutionInputSchema>;
export declare const GetTestStatusInputSchema: z.ZodObject<{
    executionId: z.ZodString;
}, z.core.$strip>;
export type GetTestStatusInput = z.infer<typeof GetTestStatusInputSchema>;
export declare const GetTestResultsInputSchema: z.ZodObject<{
    executionId: z.ZodString;
    verbose: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type GetTestResultsInput = z.infer<typeof GetTestResultsInputSchema>;
export declare const TOOL_DEFINITIONS: readonly [{
    readonly name: "launch_test_execution";
    readonly description: "Start a Touchstone test execution using a pre-configured Test Setup. Returns an execution ID for tracking.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly testSetupName: {
                readonly type: "string";
                readonly description: "Name of the Test Setup configured in Touchstone UI";
            };
        };
        readonly required: readonly ["testSetupName"];
    };
}, {
    readonly name: "get_test_status";
    readonly description: "Check the current status of a test execution.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly executionId: {
                readonly type: "string";
                readonly description: "The execution ID returned from launch_test_execution";
            };
        };
        readonly required: readonly ["executionId"];
    };
}, {
    readonly name: "get_test_results";
    readonly description: "Retrieve detailed results for a completed test execution, including passed tests and failure details.";
    readonly inputSchema: {
        readonly type: "object";
        readonly properties: {
            readonly executionId: {
                readonly type: "string";
                readonly description: "The execution ID returned from launch_test_execution";
            };
            readonly verbose: {
                readonly type: "boolean";
                readonly description: "When true, fetches individual test details for all scripts including passing ones. Note: adds ~15 seconds per script due to API rate limits.";
            };
        };
        readonly required: readonly ["executionId"];
    };
}];
//# sourceMappingURL=tools.d.ts.map