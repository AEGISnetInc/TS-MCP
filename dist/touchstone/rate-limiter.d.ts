export declare class RateLimiter {
    private lastCall;
    throttle(endpoint: string, minIntervalMs: number): Promise<void>;
}
export declare const RATE_LIMITS: {
    readonly STATUS_ENDPOINT: 4000;
    readonly DETAIL_ENDPOINT: 15000;
    readonly SCRIPT_DETAIL_ENDPOINT: 15000;
};
//# sourceMappingURL=rate-limiter.d.ts.map