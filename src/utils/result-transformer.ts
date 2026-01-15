import type {
  ExecutionDetailResponse,
  SummarizedTestResults,
  TestFailure
} from '../touchstone/types.js';

export function transformResults(raw: ExecutionDetailResponse): SummarizedTestResults {
  const scriptResults = raw.scriptResults ?? [];

  const passed: string[] = [];
  const failures: TestFailure[] = [];

  for (const script of scriptResults) {
    const isPassed = script.status === 'Passed' || script.status === 'PassedWithWarnings';

    if (isPassed) {
      passed.push(script.testScriptName);
    } else if (script.status === 'Failed' || script.status === 'Error') {
      failures.push({
        testScript: script.testScriptName,
        assertion: 'Test script failed',
        message: `Status: ${script.status}`
      });
    }
  }

  return {
    executionId: String(raw.testExecId),
    status: raw.status,
    summary: {
      total: scriptResults.length,
      passed: passed.length,
      failed: failures.length,
      skipped: scriptResults.length - passed.length - failures.length
    },
    passed,
    failures
  };
}
