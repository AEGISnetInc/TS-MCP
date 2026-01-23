/**
 * Proxy server that bridges STDIO transport (from Claude Code) to
 * HTTP transport (to cloud server) with dynamic auth from keychain.
 */
export declare class ProxyServer {
    private stdioTransport;
    private httpTransport;
    private isShuttingDown;
    constructor(cloudUrl?: string);
    run(): Promise<void>;
    shutdown(): Promise<void>;
    /**
     * Determine if an error is an authentication error.
     * Uses typed StreamableHTTPError when available, falls back to message parsing.
     */
    private isAuthenticationError;
}
/**
 * Run the proxy server.
 */
export declare function runProxyServer(cloudUrl?: string): Promise<void>;
//# sourceMappingURL=proxy-server.d.ts.map