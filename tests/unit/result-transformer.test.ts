import { transformResults } from '../../src/utils/result-transformer.js';
import type { ExecutionDetailResponse, ScriptExecDetailResponse } from '../../src/touchstone/types.js';

describe('transformResults', () => {
  it('transforms passed execution correctly', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      testScriptExecutions: [
        {
          testScript: '/FHIR/Patient/Patient-create',
          status: 'Passed',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 3, numberOfTestFailures: 0 }
        },
        {
          testScript: '/FHIR/Patient/Patient-read',
          status: 'Passed',
          statusCounts: { numberOfTests: 5, numberOfTestPasses: 5, numberOfTestFailures: 0 }
        },
        {
          testScript: '/FHIR/Patient/Patient-update',
          status: 'Passed',
          statusCounts: { numberOfTests: 2, numberOfTestPasses: 2, numberOfTestFailures: 0 }
        }
      ]
    };

    const result = transformResults(raw);

    expect(result.executionId).toBe('12345');
    expect(result.status).toBe('Passed');
    expect(result.summary.total).toBe(10);
    expect(result.summary.passed).toBe(10);
    expect(result.summary.failed).toBe(0);
    expect(result.scripts).toHaveLength(3);
    expect(result.scripts[0].name).toBe('Patient-create');
    expect(result.scripts[0].status).toBe('Passed');
    expect(result.failures).toEqual([]);
  });

  it('transforms failed execution without script details (summary only)', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Failed',
      testScriptExecutions: [
        {
          testScript: '/FHIR/Patient/Patient-create',
          status: 'Passed',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 3, numberOfTestFailures: 0 }
        },
        {
          testScript: '/FHIR/Patient/Patient-read',
          status: 'Failed',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 2, numberOfTestFailures: 1 }
        }
      ]
    };

    const result = transformResults(raw);

    expect(result.status).toBe('Failed');
    expect(result.summary.total).toBe(6);
    expect(result.summary.passed).toBe(5);
    expect(result.summary.failed).toBe(1);
    expect(result.scripts).toHaveLength(2);
    expect(result.scripts[0].name).toBe('Patient-create');
    expect(result.scripts[1].name).toBe('Patient-read');
    expect(result.scripts[1].status).toBe('Failed');
    // Without script details, we get a generic failure
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].script).toBe('Patient-read');
    expect(result.failures[0].test).toBe('Unknown');
  });

  it('transforms failed execution with script details', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Failed',
      testScriptExecutions: [
        {
          testScript: '/FHIR/Patient/Patient-create',
          status: 'Passed',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 3, numberOfTestFailures: 0 }
        },
        {
          testScript: '/FHIR/Patient/Patient-read',
          status: 'Failed',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 2, numberOfTestFailures: 1 }
        }
      ]
    };

    const scriptDetails = new Map<string, ScriptExecDetailResponse>();
    scriptDetails.set('/FHIR/Patient/Patient-read', {
      status: 'Failed',
      testScript: '/FHIR/Patient/Patient-read',
      testItemExecutions: [
        {
          name: '01-Read-Existing',
          status: 'Passed',
          operationExecutions: [
            {
              assertionExecutions: [
                { status: 'Passed', summary: 'Response status code is 200' }
              ]
            }
          ]
        },
        {
          name: '02-Read-NonExistent',
          status: 'Failed',
          operationExecutions: [
            {
              assertionExecutions: [
                { status: 'Failed', summary: 'Response status code is 404', error: 'Expected 404 but got 500' }
              ]
            }
          ]
        }
      ]
    });

    const result = transformResults(raw, scriptDetails);

    expect(result.status).toBe('Failed');
    expect(result.scripts).toHaveLength(2);
    expect(result.scripts[1].tests).toHaveLength(2);
    expect(result.scripts[1].tests[0].name).toBe('01-Read-Existing');
    expect(result.scripts[1].tests[0].status).toBe('Passed');
    expect(result.scripts[1].tests[1].name).toBe('02-Read-NonExistent');
    expect(result.scripts[1].tests[1].status).toBe('Failed');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].script).toBe('Patient-read');
    expect(result.failures[0].test).toBe('02-Read-NonExistent');
    expect(result.failures[0].assertion).toBe('Response status code is 404');
    expect(result.failures[0].error).toBe('Expected 404 but got 500');
  });

  it('handles empty script executions', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      testScriptExecutions: []
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(0);
    expect(result.scripts).toEqual([]);
    expect(result.failures).toEqual([]);
  });

  it('handles missing script executions', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Running'
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(0);
    expect(result.scripts).toEqual([]);
  });

  it('handles PassedWithWarnings status', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'PassedWithWarnings',
      testScriptExecutions: [
        {
          testScript: '/FHIR/Patient/Patient-create',
          status: 'PassedWithWarnings',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 2, numberOfTestPassesWarn: 1, numberOfTestFailures: 0 }
        }
      ]
    };

    const result = transformResults(raw);

    expect(result.summary.passed).toBe(3); // includes warnings
    expect(result.scripts[0].status).toBe('PassedWithWarnings');
    expect(result.failures).toEqual([]);
  });

  it('handles Error status as failure', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Error',
      testScriptExecutions: [
        {
          testScript: '/FHIR/Patient/Patient-create',
          status: 'Error',
          statusCounts: { numberOfTests: 3, numberOfTestPasses: 0, numberOfTestFailures: 3 }
        }
      ]
    };

    const result = transformResults(raw);

    expect(result.summary.failed).toBe(3);
    expect(result.scripts[0].status).toBe('Error');
    // Without script details, we get a generic failure
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].script).toBe('Patient-create');
  });

  it('extracts short name from full script path', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      testScriptExecutions: [
        {
          testScript: '/FHIR3-0-2-Basic/P-R/Patient/Client Assigned Id/Patient-client-id-xml',
          status: 'Passed',
          statusCounts: { numberOfTests: 7, numberOfTestPasses: 7, numberOfTestFailures: 0 }
        }
      ]
    };

    const result = transformResults(raw);

    expect(result.scripts[0].name).toBe('Patient-client-id-xml');
  });

  it('uses numberOfTests as fallback when statusCounts missing', () => {
    const raw: ExecutionDetailResponse = {
      testExecId: 12345,
      status: 'Passed',
      testScriptExecutions: [
        {
          testScript: '/FHIR/Patient/Patient-create',
          status: 'Passed',
          numberOfTests: 5
        }
      ]
    };

    const result = transformResults(raw);

    expect(result.summary.total).toBe(5);
  });
});
