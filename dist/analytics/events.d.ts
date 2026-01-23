export declare const AnalyticsEvents: {
    readonly AUTH_SUCCESS: "auth_success";
    readonly AUTH_FAILURE: "auth_failure";
    readonly TEST_LAUNCHED: "test_launched";
    readonly TEST_COMPLETED: "test_completed";
    readonly TEST_POLL: "test_poll";
    readonly API_ERROR: "api_error";
    readonly TOOL_ERROR: "tool_error";
};
export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
export interface AuthSuccessProperties {
    base_url: string;
}
export interface AuthFailureProperties {
    base_url: string;
    error_code: string;
}
export interface TestLaunchedProperties {
    base_url: string;
}
export interface TestCompletedProperties {
    execution_id: string;
    status: string;
    duration_ms: number;
    passed_count: number;
    failed_count: number;
}
export interface TestPollProperties {
    execution_id: string;
    status: string;
}
export interface ApiErrorProperties {
    endpoint: string;
    status_code?: number;
    error_message: string;
}
export interface ToolErrorProperties {
    tool_name: string;
    error_code: string;
    error_message: string;
}
//# sourceMappingURL=events.d.ts.map