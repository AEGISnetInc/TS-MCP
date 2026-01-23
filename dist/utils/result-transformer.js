/**
 * Extract the short name from a full test script path.
 * E.g., "/FHIR3-0-2-Basic/P-R/Patient/Client Assigned Id/Patient-client-id-xml" -> "Patient-client-id-xml"
 */
function getScriptShortName(testScript) {
    const parts = testScript.split('/');
    return parts[parts.length - 1] || testScript;
}
/**
 * Extract failures from a script detail response.
 * Drills into testItemExecutions -> operationExecutions -> assertionExecutions.
 */
function extractFailuresFromScriptDetail(scriptDetail, scriptName) {
    const failures = [];
    const testItems = scriptDetail.testItemExecutions ?? [];
    for (const testItem of testItems) {
        const testName = testItem.name ?? 'Unknown Test';
        const operations = testItem.operationExecutions ?? [];
        for (const operation of operations) {
            const assertions = operation.assertionExecutions ?? [];
            for (const assertion of assertions) {
                if (assertion.status === 'Failed' || assertion.status === 'Error') {
                    failures.push({
                        script: scriptName,
                        test: testName,
                        assertion: assertion.summary ?? 'Assertion failed',
                        error: assertion.error,
                        description: assertion.description
                    });
                }
            }
        }
    }
    return failures;
}
/**
 * Extract test item results from a script detail response.
 */
function extractTestItemsFromScriptDetail(scriptDetail) {
    const testItems = scriptDetail.testItemExecutions ?? [];
    return testItems.map(item => ({
        name: item.name ?? 'Unknown Test',
        status: item.status ?? 'Unknown'
    }));
}
/**
 * Transform execution detail and optional script details into summarized results.
 *
 * @param execDetail - The execution detail response from /api/testExecDetail/<id>
 * @param scriptDetails - Map of script path to script detail response (for failed scripts)
 */
export function transformResults(execDetail, scriptDetails) {
    const scriptExecutions = execDetail.testScriptExecutions ?? [];
    const scripts = [];
    const failures = [];
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    for (const scriptExec of scriptExecutions) {
        const scriptPath = scriptExec.testScript;
        const scriptName = getScriptShortName(scriptPath);
        const scriptStatus = scriptExec.status;
        // Get counts from the script execution
        const counts = scriptExec.statusCounts;
        const scriptTotalTests = counts?.numberOfTests ?? scriptExec.numberOfTests ?? 0;
        const scriptPassedTests = (counts?.numberOfTestPasses ?? 0) + (counts?.numberOfTestPassesWarn ?? 0);
        const scriptFailedTests = counts?.numberOfTestFailures ?? 0;
        totalTests += scriptTotalTests;
        passedTests += scriptPassedTests;
        failedTests += scriptFailedTests;
        // Check if we have detailed script information
        const scriptDetail = scriptDetails?.get(scriptPath);
        if (scriptDetail) {
            // We have detailed info - extract individual test results and failures
            const testItems = extractTestItemsFromScriptDetail(scriptDetail);
            const scriptFailures = extractFailuresFromScriptDetail(scriptDetail, scriptName);
            scripts.push({
                name: scriptName,
                status: scriptStatus,
                tests: testItems
            });
            failures.push(...scriptFailures);
        }
        else {
            // No detailed info - use summary only
            scripts.push({
                name: scriptName,
                status: scriptStatus,
                tests: [] // No individual test details available
            });
            // If failed but no details, add a generic failure entry
            if (scriptStatus === 'Failed' || scriptStatus === 'Error') {
                failures.push({
                    script: scriptName,
                    test: 'Unknown',
                    assertion: 'Script failed (no details fetched)',
                    error: `Status: ${scriptStatus}`
                });
            }
        }
    }
    // Calculate skipped from the difference
    const skippedTests = totalTests - passedTests - failedTests;
    return {
        executionId: String(execDetail.testExecId),
        status: execDetail.status,
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            skipped: skippedTests > 0 ? skippedTests : 0
        },
        scripts,
        failures
    };
}
//# sourceMappingURL=result-transformer.js.map