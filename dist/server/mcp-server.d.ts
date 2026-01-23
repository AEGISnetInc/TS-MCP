import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { AuthProvider } from '../auth/auth-provider.js';
export declare class TSMCPServer {
    private server;
    private authProvider;
    private touchstoneClient;
    private rateLimiter;
    private analytics;
    private config;
    constructor(authProvider: AuthProvider);
    private setupHandlers;
    private handleLaunchExecution;
    private handleGetStatus;
    private handleGetResults;
    /**
     * Connects the MCP server to an external transport.
     * Used for HTTP/cloud mode where the transport is managed externally.
     */
    connectTransport(transport: Transport): void;
    run(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=mcp-server.d.ts.map