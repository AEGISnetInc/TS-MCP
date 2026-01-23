import { z } from 'zod';
export declare const AuthRequestSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type AuthRequest = z.infer<typeof AuthRequestSchema>;
export declare const AuthResponseSchema: z.ZodObject<{
    'API-Key': z.ZodString;
}, z.core.$strip>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export declare const LaunchExecutionRequestSchema: z.ZodObject<{
    testSetup: z.ZodString;
}, z.core.$strip>;
export type LaunchExecutionRequest = z.infer<typeof LaunchExecutionRequestSchema>;
export declare const LaunchExecutionResponseSchema: z.ZodObject<{
    testExecId: z.ZodNumber;
}, z.core.$strip>;
export type LaunchExecutionResponse = z.infer<typeof LaunchExecutionResponseSchema>;
export declare const ExecutionStatusSchema: z.ZodEnum<{
    "Not Started": "Not Started";
    Running: "Running";
    Passed: "Passed";
    PassedWithWarnings: "PassedWithWarnings";
    Failed: "Failed";
    Stopped: "Stopped";
    Error: "Error";
    "OAuth2-Authorize": "OAuth2-Authorize";
    "Waiting for Request": "Waiting for Request";
}>;
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;
export declare const ExecutionStatusResponseSchema: z.ZodObject<{
    testExecId: z.ZodNumber;
    status: z.ZodEnum<{
        "Not Started": "Not Started";
        Running: "Running";
        Passed: "Passed";
        PassedWithWarnings: "PassedWithWarnings";
        Failed: "Failed";
        Stopped: "Stopped";
        Error: "Error";
        "OAuth2-Authorize": "OAuth2-Authorize";
        "Waiting for Request": "Waiting for Request";
    }>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ExecutionStatusResponse = z.infer<typeof ExecutionStatusResponseSchema>;
export declare const StatusCountsSchema: z.ZodObject<{
    numberOfTests: z.ZodOptional<z.ZodNumber>;
    numberOfTestsNotStarted: z.ZodOptional<z.ZodNumber>;
    numberOfTestsRunning: z.ZodOptional<z.ZodNumber>;
    numberOfTestsStopped: z.ZodOptional<z.ZodNumber>;
    numberOfTestPasses: z.ZodOptional<z.ZodNumber>;
    numberOfTestPassesWarn: z.ZodOptional<z.ZodNumber>;
    numberOfTestFailures: z.ZodOptional<z.ZodNumber>;
    numberOfTestsSkipped: z.ZodOptional<z.ZodNumber>;
    numberOfTestsWaiting: z.ZodOptional<z.ZodNumber>;
    successRate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type StatusCounts = z.infer<typeof StatusCountsSchema>;
export declare const TestSysAttributesSchema: z.ZodObject<{
    testSystem: z.ZodOptional<z.ZodString>;
    organization: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
    hostName: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type TestSysAttributes = z.infer<typeof TestSysAttributesSchema>;
export declare const TestScriptExecutionSchema: z.ZodObject<{
    status: z.ZodEnum<{
        "Not Started": "Not Started";
        Running: "Running";
        Passed: "Passed";
        PassedWithWarnings: "PassedWithWarnings";
        Failed: "Failed";
        Stopped: "Stopped";
        Error: "Error";
        "OAuth2-Authorize": "OAuth2-Authorize";
        "Waiting for Request": "Waiting for Request";
    }>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    testScript: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    specification: z.ZodOptional<z.ZodString>;
    statusCounts: z.ZodOptional<z.ZodObject<{
        numberOfTests: z.ZodOptional<z.ZodNumber>;
        numberOfTestsNotStarted: z.ZodOptional<z.ZodNumber>;
        numberOfTestsRunning: z.ZodOptional<z.ZodNumber>;
        numberOfTestsStopped: z.ZodOptional<z.ZodNumber>;
        numberOfTestPasses: z.ZodOptional<z.ZodNumber>;
        numberOfTestPassesWarn: z.ZodOptional<z.ZodNumber>;
        numberOfTestFailures: z.ZodOptional<z.ZodNumber>;
        numberOfTestsSkipped: z.ZodOptional<z.ZodNumber>;
        numberOfTestsWaiting: z.ZodOptional<z.ZodNumber>;
        successRate: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    scriptExecURL: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
    numberOfTests: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type TestScriptExecution = z.infer<typeof TestScriptExecutionSchema>;
export declare const ExecutionDetailResponseSchema: z.ZodObject<{
    info: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        "Not Started": "Not Started";
        Running: "Running";
        Passed: "Passed";
        PassedWithWarnings: "PassedWithWarnings";
        Failed: "Failed";
        Stopped: "Stopped";
        Error: "Error";
        "OAuth2-Authorize": "OAuth2-Authorize";
        "Waiting for Request": "Waiting for Request";
    }>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    testSetupName: z.ZodOptional<z.ZodString>;
    destinations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        testSystem: z.ZodOptional<z.ZodString>;
        organization: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        hostName: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    statusCounts: z.ZodOptional<z.ZodObject<{
        numberOfTests: z.ZodOptional<z.ZodNumber>;
        numberOfTestsNotStarted: z.ZodOptional<z.ZodNumber>;
        numberOfTestsRunning: z.ZodOptional<z.ZodNumber>;
        numberOfTestsStopped: z.ZodOptional<z.ZodNumber>;
        numberOfTestPasses: z.ZodOptional<z.ZodNumber>;
        numberOfTestPassesWarn: z.ZodOptional<z.ZodNumber>;
        numberOfTestFailures: z.ZodOptional<z.ZodNumber>;
        numberOfTestsSkipped: z.ZodOptional<z.ZodNumber>;
        numberOfTestsWaiting: z.ZodOptional<z.ZodNumber>;
        successRate: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    testExecURL: z.ZodOptional<z.ZodString>;
    testExecId: z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>;
    user: z.ZodOptional<z.ZodString>;
    organization: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
    numberOfScripts: z.ZodOptional<z.ZodNumber>;
    testScriptExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        status: z.ZodEnum<{
            "Not Started": "Not Started";
            Running: "Running";
            Passed: "Passed";
            PassedWithWarnings: "PassedWithWarnings";
            Failed: "Failed";
            Stopped: "Stopped";
            Error: "Error";
            "OAuth2-Authorize": "OAuth2-Authorize";
            "Waiting for Request": "Waiting for Request";
        }>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        testScript: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        version: z.ZodOptional<z.ZodNumber>;
        specification: z.ZodOptional<z.ZodString>;
        statusCounts: z.ZodOptional<z.ZodObject<{
            numberOfTests: z.ZodOptional<z.ZodNumber>;
            numberOfTestsNotStarted: z.ZodOptional<z.ZodNumber>;
            numberOfTestsRunning: z.ZodOptional<z.ZodNumber>;
            numberOfTestsStopped: z.ZodOptional<z.ZodNumber>;
            numberOfTestPasses: z.ZodOptional<z.ZodNumber>;
            numberOfTestPassesWarn: z.ZodOptional<z.ZodNumber>;
            numberOfTestFailures: z.ZodOptional<z.ZodNumber>;
            numberOfTestsSkipped: z.ZodOptional<z.ZodNumber>;
            numberOfTestsWaiting: z.ZodOptional<z.ZodNumber>;
            successRate: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        scriptExecURL: z.ZodOptional<z.ZodString>;
        domain: z.ZodOptional<z.ZodString>;
        numberOfTests: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type ExecutionDetailResponse = z.infer<typeof ExecutionDetailResponseSchema>;
export declare const AssertionExecDetailSchema: z.ZodObject<{
    error: z.ZodOptional<z.ZodString>;
    warning: z.ZodOptional<z.ZodString>;
    info: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type AssertionExecDetail = z.infer<typeof AssertionExecDetailSchema>;
export declare const OperRequestSchema: z.ZodObject<{
    method: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type OperRequest = z.infer<typeof OperRequestSchema>;
export declare const OperResponseSchema: z.ZodObject<{
    headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>;
    statusLine: z.ZodOptional<z.ZodString>;
    statusCode: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type OperResponse = z.infer<typeof OperResponseSchema>;
export declare const OperationExecDetailSchema: z.ZodObject<{
    error: z.ZodOptional<z.ZodString>;
    warning: z.ZodOptional<z.ZodString>;
    info: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    resource: z.ZodOptional<z.ZodString>;
    origin: z.ZodOptional<z.ZodObject<{
        testSystem: z.ZodOptional<z.ZodString>;
        organization: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        hostName: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    destination: z.ZodOptional<z.ZodObject<{
        testSystem: z.ZodOptional<z.ZodString>;
        organization: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        hostName: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    request: z.ZodOptional<z.ZodObject<{
        method: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    response: z.ZodOptional<z.ZodObject<{
        headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>>;
        statusLine: z.ZodOptional<z.ZodString>;
        statusCode: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    assertionExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        error: z.ZodOptional<z.ZodString>;
        warning: z.ZodOptional<z.ZodString>;
        info: z.ZodOptional<z.ZodString>;
        status: z.ZodString;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type OperationExecDetail = z.infer<typeof OperationExecDetailSchema>;
export declare const SectionExecDetailSchema: z.ZodObject<{
    error: z.ZodOptional<z.ZodString>;
    warning: z.ZodOptional<z.ZodString>;
    info: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    operationExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        error: z.ZodOptional<z.ZodString>;
        warning: z.ZodOptional<z.ZodString>;
        info: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        resource: z.ZodOptional<z.ZodString>;
        origin: z.ZodOptional<z.ZodObject<{
            testSystem: z.ZodOptional<z.ZodString>;
            organization: z.ZodOptional<z.ZodString>;
            baseUrl: z.ZodOptional<z.ZodString>;
            hostName: z.ZodOptional<z.ZodString>;
            profile: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        destination: z.ZodOptional<z.ZodObject<{
            testSystem: z.ZodOptional<z.ZodString>;
            organization: z.ZodOptional<z.ZodString>;
            baseUrl: z.ZodOptional<z.ZodString>;
            hostName: z.ZodOptional<z.ZodString>;
            profile: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        request: z.ZodOptional<z.ZodObject<{
            method: z.ZodOptional<z.ZodString>;
            path: z.ZodOptional<z.ZodString>;
            headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                value: z.ZodString;
            }, z.core.$strip>>>;
        }, z.core.$strip>>;
        response: z.ZodOptional<z.ZodObject<{
            headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                value: z.ZodString;
            }, z.core.$strip>>>;
            statusLine: z.ZodOptional<z.ZodString>;
            statusCode: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        assertionExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            error: z.ZodOptional<z.ZodString>;
            warning: z.ZodOptional<z.ZodString>;
            info: z.ZodOptional<z.ZodString>;
            status: z.ZodString;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            summary: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type SectionExecDetail = z.infer<typeof SectionExecDetailSchema>;
export declare const ScriptExecDetailResponseSchema: z.ZodObject<{
    error: z.ZodOptional<z.ZodString>;
    warning: z.ZodOptional<z.ZodString>;
    info: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<{
        "Not Started": "Not Started";
        Running: "Running";
        Passed: "Passed";
        PassedWithWarnings: "PassedWithWarnings";
        Failed: "Failed";
        Stopped: "Stopped";
        Error: "Error";
        "OAuth2-Authorize": "OAuth2-Authorize";
        "Waiting for Request": "Waiting for Request";
    }>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    testScript: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodNumber>;
    specification: z.ZodOptional<z.ZodString>;
    statusCounts: z.ZodOptional<z.ZodObject<{
        numberOfTests: z.ZodOptional<z.ZodNumber>;
        numberOfTestsNotStarted: z.ZodOptional<z.ZodNumber>;
        numberOfTestsRunning: z.ZodOptional<z.ZodNumber>;
        numberOfTestsStopped: z.ZodOptional<z.ZodNumber>;
        numberOfTestPasses: z.ZodOptional<z.ZodNumber>;
        numberOfTestPassesWarn: z.ZodOptional<z.ZodNumber>;
        numberOfTestFailures: z.ZodOptional<z.ZodNumber>;
        numberOfTestsSkipped: z.ZodOptional<z.ZodNumber>;
        numberOfTestsWaiting: z.ZodOptional<z.ZodNumber>;
        successRate: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    testExecURL: z.ZodOptional<z.ZodString>;
    scriptExecURL: z.ZodOptional<z.ZodString>;
    testExecId: z.ZodOptional<z.ZodUnion<readonly [z.ZodNumber, z.ZodString]>>;
    user: z.ZodOptional<z.ZodString>;
    organization: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
    origins: z.ZodOptional<z.ZodArray<z.ZodObject<{
        testSystem: z.ZodOptional<z.ZodString>;
        organization: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        hostName: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    destinations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        testSystem: z.ZodOptional<z.ZodString>;
        organization: z.ZodOptional<z.ZodString>;
        baseUrl: z.ZodOptional<z.ZodString>;
        hostName: z.ZodOptional<z.ZodString>;
        profile: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    numberOfTests: z.ZodOptional<z.ZodNumber>;
    oauth2AuthzUrl: z.ZodOptional<z.ZodString>;
    setupExecution: z.ZodOptional<z.ZodObject<{
        error: z.ZodOptional<z.ZodString>;
        warning: z.ZodOptional<z.ZodString>;
        info: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        operationExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            error: z.ZodOptional<z.ZodString>;
            warning: z.ZodOptional<z.ZodString>;
            info: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            resource: z.ZodOptional<z.ZodString>;
            origin: z.ZodOptional<z.ZodObject<{
                testSystem: z.ZodOptional<z.ZodString>;
                organization: z.ZodOptional<z.ZodString>;
                baseUrl: z.ZodOptional<z.ZodString>;
                hostName: z.ZodOptional<z.ZodString>;
                profile: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            destination: z.ZodOptional<z.ZodObject<{
                testSystem: z.ZodOptional<z.ZodString>;
                organization: z.ZodOptional<z.ZodString>;
                baseUrl: z.ZodOptional<z.ZodString>;
                hostName: z.ZodOptional<z.ZodString>;
                profile: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            request: z.ZodOptional<z.ZodObject<{
                method: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
                headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>>;
            }, z.core.$strip>>;
            response: z.ZodOptional<z.ZodObject<{
                headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>>;
                statusLine: z.ZodOptional<z.ZodString>;
                statusCode: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            assertionExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                error: z.ZodOptional<z.ZodString>;
                warning: z.ZodOptional<z.ZodString>;
                info: z.ZodOptional<z.ZodString>;
                status: z.ZodString;
                startTime: z.ZodOptional<z.ZodString>;
                endTime: z.ZodOptional<z.ZodString>;
                duration: z.ZodOptional<z.ZodString>;
                summary: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    testItemExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        error: z.ZodOptional<z.ZodString>;
        warning: z.ZodOptional<z.ZodString>;
        info: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        operationExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            error: z.ZodOptional<z.ZodString>;
            warning: z.ZodOptional<z.ZodString>;
            info: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            resource: z.ZodOptional<z.ZodString>;
            origin: z.ZodOptional<z.ZodObject<{
                testSystem: z.ZodOptional<z.ZodString>;
                organization: z.ZodOptional<z.ZodString>;
                baseUrl: z.ZodOptional<z.ZodString>;
                hostName: z.ZodOptional<z.ZodString>;
                profile: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            destination: z.ZodOptional<z.ZodObject<{
                testSystem: z.ZodOptional<z.ZodString>;
                organization: z.ZodOptional<z.ZodString>;
                baseUrl: z.ZodOptional<z.ZodString>;
                hostName: z.ZodOptional<z.ZodString>;
                profile: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            request: z.ZodOptional<z.ZodObject<{
                method: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
                headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>>;
            }, z.core.$strip>>;
            response: z.ZodOptional<z.ZodObject<{
                headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>>;
                statusLine: z.ZodOptional<z.ZodString>;
                statusCode: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            assertionExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                error: z.ZodOptional<z.ZodString>;
                warning: z.ZodOptional<z.ZodString>;
                info: z.ZodOptional<z.ZodString>;
                status: z.ZodString;
                startTime: z.ZodOptional<z.ZodString>;
                endTime: z.ZodOptional<z.ZodString>;
                duration: z.ZodOptional<z.ZodString>;
                summary: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    teardownExecution: z.ZodOptional<z.ZodObject<{
        error: z.ZodOptional<z.ZodString>;
        warning: z.ZodOptional<z.ZodString>;
        info: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        startTime: z.ZodOptional<z.ZodString>;
        endTime: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        operationExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
            error: z.ZodOptional<z.ZodString>;
            warning: z.ZodOptional<z.ZodString>;
            info: z.ZodOptional<z.ZodString>;
            status: z.ZodOptional<z.ZodString>;
            startTime: z.ZodOptional<z.ZodString>;
            endTime: z.ZodOptional<z.ZodString>;
            duration: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            resource: z.ZodOptional<z.ZodString>;
            origin: z.ZodOptional<z.ZodObject<{
                testSystem: z.ZodOptional<z.ZodString>;
                organization: z.ZodOptional<z.ZodString>;
                baseUrl: z.ZodOptional<z.ZodString>;
                hostName: z.ZodOptional<z.ZodString>;
                profile: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            destination: z.ZodOptional<z.ZodObject<{
                testSystem: z.ZodOptional<z.ZodString>;
                organization: z.ZodOptional<z.ZodString>;
                baseUrl: z.ZodOptional<z.ZodString>;
                hostName: z.ZodOptional<z.ZodString>;
                profile: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>;
            request: z.ZodOptional<z.ZodObject<{
                method: z.ZodOptional<z.ZodString>;
                path: z.ZodOptional<z.ZodString>;
                headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>>;
            }, z.core.$strip>>;
            response: z.ZodOptional<z.ZodObject<{
                headers: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    name: z.ZodString;
                    value: z.ZodString;
                }, z.core.$strip>>>;
                statusLine: z.ZodOptional<z.ZodString>;
                statusCode: z.ZodOptional<z.ZodNumber>;
            }, z.core.$strip>>;
            assertionExecutions: z.ZodOptional<z.ZodArray<z.ZodObject<{
                error: z.ZodOptional<z.ZodString>;
                warning: z.ZodOptional<z.ZodString>;
                info: z.ZodOptional<z.ZodString>;
                status: z.ZodString;
                startTime: z.ZodOptional<z.ZodString>;
                endTime: z.ZodOptional<z.ZodString>;
                duration: z.ZodOptional<z.ZodString>;
                summary: z.ZodOptional<z.ZodString>;
                description: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ScriptExecDetailResponse = z.infer<typeof ScriptExecDetailResponseSchema>;
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
//# sourceMappingURL=types.d.ts.map