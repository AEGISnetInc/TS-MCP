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
    /**
     * Execute a tool with automatic API key refresh on expiration.
     */
    private executeToolWithAutoRefresh;
    /**
     * Try to refresh the API key using stored credentials.
     */
    private tryRefreshApiKey;
    /**
     * Execute a tool by name.
     */
    private executeTool;
    private handleLaunchExecution;
    private handleGetStatus;
    private handleGetResults;
    /**
     * Connects the MCP server to an external transport.
     */
    connectTransport(transport: Transport): void;
    run(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=mcp-server.d.ts.map