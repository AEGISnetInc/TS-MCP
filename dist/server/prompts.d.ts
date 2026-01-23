export declare const PROMPT_DEFINITIONS: readonly [{
    readonly name: "run-tests";
    readonly description: "Execute a Touchstone test setup and return results when complete. Auto-polls until finished.";
    readonly arguments: readonly [{
        readonly name: "testSetupName";
        readonly description: "Name of the Test Setup configured in Touchstone UI";
        readonly required: true;
    }];
}, {
    readonly name: "check-results";
    readonly description: "Check results for a previous test execution by ID.";
    readonly arguments: readonly [{
        readonly name: "executionId";
        readonly description: "The execution ID from a previous test run";
        readonly required: true;
    }];
}];
export declare function getRunTestsPromptContent(testSetupName: string): string;
export declare function getCheckResultsPromptContent(executionId: string): string;
//# sourceMappingURL=prompts.d.ts.map