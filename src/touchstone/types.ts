import { z } from 'zod';

// Authentication
export const AuthRequestSchema = z.object({
  username: z.string(),
  password: z.string()
});
export type AuthRequest = z.infer<typeof AuthRequestSchema>;

export const AuthResponseSchema = z.object({
  'API-Key': z.string()
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Test Execution
export const LaunchExecutionRequestSchema = z.object({
  testSetup: z.string()
});
export type LaunchExecutionRequest = z.infer<typeof LaunchExecutionRequestSchema>;

export const LaunchExecutionResponseSchema = z.object({
  testExecId: z.number()
});
export type LaunchExecutionResponse = z.infer<typeof LaunchExecutionResponseSchema>;

// Execution Status
export const ExecutionStatusSchema = z.enum([
  'Not Started',
  'Running',
  'Passed',
  'PassedWithWarnings',
  'Failed',
  'Stopped',
  'Error',
  'OAuth2-Authorize',
  'Waiting for Request'
]);
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

export const ExecutionStatusResponseSchema = z.object({
  testExecId: z.number(),
  status: ExecutionStatusSchema,
  message: z.string().optional()
});
export type ExecutionStatusResponse = z.infer<typeof ExecutionStatusResponseSchema>;

// Status Counts (used in execution and script responses)
export const StatusCountsSchema = z.object({
  numberOfTests: z.number().optional(),
  numberOfTestsNotStarted: z.number().optional(),
  numberOfTestsRunning: z.number().optional(),
  numberOfTestsStopped: z.number().optional(),
  numberOfTestPasses: z.number().optional(),
  numberOfTestPassesWarn: z.number().optional(),
  numberOfTestFailures: z.number().optional(),
  numberOfTestsSkipped: z.number().optional(),
  numberOfTestsWaiting: z.number().optional(),
  successRate: z.string().optional()
});
export type StatusCounts = z.infer<typeof StatusCountsSchema>;

// Test System Attributes
export const TestSysAttributesSchema = z.object({
  testSystem: z.string().optional(),
  organization: z.string().optional(),
  baseUrl: z.string().optional(),
  hostName: z.string().optional(),
  profile: z.string().optional()
});
export type TestSysAttributes = z.infer<typeof TestSysAttributesSchema>;

// Test Script Execution (summary within execution detail)
export const TestScriptExecutionSchema = z.object({
  status: ExecutionStatusSchema,
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  testScript: z.string(),
  description: z.string().optional(),
  version: z.number().optional(),
  specification: z.string().optional(),
  statusCounts: StatusCountsSchema.optional(),
  scriptExecURL: z.string().optional(),
  domain: z.string().optional(),
  numberOfTests: z.number().optional()
});
export type TestScriptExecution = z.infer<typeof TestScriptExecutionSchema>;

// Execution Detail Response (from /api/testExecDetail/<id>)
export const ExecutionDetailResponseSchema = z.object({
  info: z.string().optional(),
  status: ExecutionStatusSchema,
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  testSetupName: z.string().optional(),
  destinations: z.array(TestSysAttributesSchema).optional(),
  statusCounts: StatusCountsSchema.optional(),
  testExecURL: z.string().optional(),
  testExecId: z.union([z.number(), z.string()]),
  user: z.string().optional(),
  organization: z.string().optional(),
  domain: z.string().optional(),
  numberOfScripts: z.number().optional(),
  testScriptExecutions: z.array(TestScriptExecutionSchema).optional()
});
export type ExecutionDetailResponse = z.infer<typeof ExecutionDetailResponseSchema>;

// Assertion Execution Detail (individual assertion within an operation)
export const AssertionExecDetailSchema = z.object({
  error: z.string().optional(),
  warning: z.string().optional(),
  info: z.string().optional(),
  status: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional()
});
export type AssertionExecDetail = z.infer<typeof AssertionExecDetailSchema>;

// Operation Request/Response
export const OperRequestSchema = z.object({
  method: z.string().optional(),
  path: z.string().optional(),
  headers: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional()
});
export type OperRequest = z.infer<typeof OperRequestSchema>;

export const OperResponseSchema = z.object({
  headers: z.array(z.object({
    name: z.string(),
    value: z.string()
  })).optional(),
  statusLine: z.string().optional(),
  statusCode: z.number().optional()
});
export type OperResponse = z.infer<typeof OperResponseSchema>;

// Operation Execution Detail (operation within a test section)
export const OperationExecDetailSchema = z.object({
  error: z.string().optional(),
  warning: z.string().optional(),
  info: z.string().optional(),
  status: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  type: z.string().optional(),
  resource: z.string().optional(),
  origin: TestSysAttributesSchema.optional(),
  destination: TestSysAttributesSchema.optional(),
  request: OperRequestSchema.optional(),
  response: OperResponseSchema.optional(),
  assertionExecutions: z.array(AssertionExecDetailSchema).optional()
});
export type OperationExecDetail = z.infer<typeof OperationExecDetailSchema>;

// Section Execution Detail (setup/test/teardown section)
export const SectionExecDetailSchema = z.object({
  error: z.string().optional(),
  warning: z.string().optional(),
  info: z.string().optional(),
  status: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  operationExecutions: z.array(OperationExecDetailSchema).optional()
});
export type SectionExecDetail = z.infer<typeof SectionExecDetailSchema>;

// Script Execution Detail Response (from /api/scriptExecDetail/<id>?testscript=<path>)
export const ScriptExecDetailResponseSchema = z.object({
  error: z.string().optional(),
  warning: z.string().optional(),
  info: z.string().optional(),
  status: ExecutionStatusSchema,
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  testScript: z.string().optional(),
  description: z.string().optional(),
  version: z.number().optional(),
  specification: z.string().optional(),
  statusCounts: StatusCountsSchema.optional(),
  testExecURL: z.string().optional(),
  scriptExecURL: z.string().optional(),
  testExecId: z.union([z.number(), z.string()]).optional(),
  user: z.string().optional(),
  organization: z.string().optional(),
  domain: z.string().optional(),
  origins: z.array(TestSysAttributesSchema).optional(),
  destinations: z.array(TestSysAttributesSchema).optional(),
  numberOfTests: z.number().optional(),
  oauth2AuthzUrl: z.string().optional(),
  setupExecution: SectionExecDetailSchema.optional(),
  testItemExecutions: z.array(SectionExecDetailSchema).optional(),
  teardownExecution: SectionExecDetailSchema.optional()
});
export type ScriptExecDetailResponse = z.infer<typeof ScriptExecDetailResponseSchema>;

// Summarized Results (our output format)
export interface TestResultSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestItemResult {
  name: string;
  status: string;
}

export interface ScriptResult {
  name: string;
  status: string;
  tests: TestItemResult[];
}

export interface TestFailure {
  script: string;
  test: string;
  assertion: string;
  error?: string;
  description?: string;
}

export interface SummarizedTestResults {
  executionId: string;
  status: string;
  summary: TestResultSummary;
  scripts: ScriptResult[];
  failures: TestFailure[];
}
