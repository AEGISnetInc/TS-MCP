export const PROMPT_DEFINITIONS = [
    {
        name: 'run-tests',
        description: 'Execute a Touchstone test setup and return results when complete. Auto-polls until finished.',
        arguments: [
            {
                name: 'testSetupName',
                description: 'Name of the Test Setup configured in Touchstone UI',
                required: true
            }
        ]
    },
    {
        name: 'check-results',
        description: 'Check results for a previous test execution by ID.',
        arguments: [
            {
                name: 'executionId',
                description: 'The execution ID from a previous test run',
                required: true
            }
        ]
    }
];
export function getRunTestsPromptContent(testSetupName) {
    return `Run the Touchstone test setup named "${testSetupName}".

Steps:
1. Use the launch_test_execution tool with testSetupName="${testSetupName}"
2. Poll get_test_status every 4 seconds until status is not "Running" or "Not Started"
3. Once complete, use get_test_results to get detailed results
4. Present a summary: total tests, passed, failed, and list any failures with details

If not authenticated, prompt the user to authenticate first.`;
}
export function getCheckResultsPromptContent(executionId) {
    return `Check the results for Touchstone test execution ID "${executionId}".

Steps:
1. Use get_test_status to check if the execution is complete
2. If complete, use get_test_results to get detailed results
3. If still running, report the current status
4. Present a summary of results if available

If not authenticated, prompt the user to authenticate first.`;
}
//# sourceMappingURL=prompts.js.map