import { transformResults } from '../../src/utils/result-transformer.js';
import type { ExecutionDetailResponse } from '../../src/touchstone/types.js';

describe('transformResults', () => {
  it('transforms passed execution correctly', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      scriptResults: [
        { testScriptName: 'Patient-create', status: 'Passed', passCount: 3, failCount: 0 },
        { testScriptName: 'Patient-read', status: 'Passed', passCount: 5, failCount: 0 },
        { testScriptName: 'Patient-update', status: 'Passed', passCount: 2, failCount: 0 }
      ]
    };

    const result = transformResults(raw);

    expect(result.executionId).toBe('12345');
    expect(result.status).toBe('Passed');
    expect(result.summary.total).toBe(3);
    expect(result.summary.passed).toBe(3);
    expect(result.summary.failed).toBe(0);
    expect(result.passed).toEqual(['Patient-create', 'Patient-read', 'Patient-update']);
    expect(result.failures).toEqual([]);
  });

  it('transforms failed execution with failure details', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Failed',
      scriptResults: [
        { testScriptName: 'Patient-create', status: 'Passed', passCount: 3, failCount: 0 },
        { testScriptName: 'Patient-read', status: 'Failed', passCount: 2, failCount: 1 }
      ]
    };

    const result = transformResults(raw);

    expect(result.status).toBe('Failed');
    expect(result.summary.passed).toBe(1);
    expect(result.summary.failed).toBe(1);
    expect(result.passed).toEqual(['Patient-create']);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].testScript).toBe('Patient-read');
  });

  it('handles empty script results', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      scriptResults: []
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(0);
    expect(result.passed).toEqual([]);
    expect(result.failures).toEqual([]);
  });

  it('handles missing script results', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Running'
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(0);
  });

  it('handles PassedWithWarnings status', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'PassedWithWarnings',
      scriptResults: [
        { testScriptName: 'Patient-create', status: 'PassedWithWarnings', passCount: 3, failCount: 0, warningCount: 1 }
      ]
    };

    const result = transformResults(raw);

    expect(result.summary.passed).toBe(1);
    expect(result.passed).toContain('Patient-create');
  });

  it('handles Error status as failure', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Error',
      scriptResults: [
        { testScriptName: 'Patient-create', status: 'Error', errorCount: 1 }
      ]
    };

    const result = transformResults(raw);

    expect(result.summary.failed).toBe(1);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].testScript).toBe('Patient-create');
  });
});
