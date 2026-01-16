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

// Execution Details
export const ScriptResultSchema = z.object({
  testScriptName: z.string(),
  status: ExecutionStatusSchema,
  passCount: z.number().optional(),
  failCount: z.number().optional(),
  errorCount: z.number().optional(),
  warningCount: z.number().optional()
});
export type ScriptResult = z.infer<typeof ScriptResultSchema>;

export const ExecutionDetailResponseSchema = z.object({
  testExecId: z.number(),
  status: ExecutionStatusSchema,
  scriptResults: z.array(ScriptResultSchema).optional()
});
export type ExecutionDetailResponse = z.infer<typeof ExecutionDetailResponseSchema>;

// Script Execution Detail (for failure info)
export const AssertionResultSchema = z.object({
  assertionId: z.string().optional(),
  result: z.string(),
  message: z.string().optional(),
  expected: z.string().optional(),
  actual: z.string().optional()
});
export type AssertionResult = z.infer<typeof AssertionResultSchema>;

export const ScriptExecutionDetailSchema = z.object({
  testScriptName: z.string(),
  status: ExecutionStatusSchema,
  assertions: z.array(AssertionResultSchema).optional()
});
export type ScriptExecutionDetail = z.infer<typeof ScriptExecutionDetailSchema>;

// Summarized Results (our output format)
export interface TestResultSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestFailure {
  testScript: string;
  assertion: string;
  expected?: string;
  actual?: string;
  message?: string;
}

export interface SummarizedTestResults {
  executionId: string;
  status: string;
  summary: TestResultSummary;
  passed: string[];
  failures: TestFailure[];
}
