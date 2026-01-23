// src/server/proxy-server.ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPClientTransport, StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import keytar from 'keytar';
const SERVICE_NAME = 'ts-mcp';
const DEFAULT_CLOUD_URL = 'https://ts-mcp.fly.dev/mcp';
/**
 * Get the session token from the keychain for the cloud server.
 */
async function getSessionToken(cloudUrl) {
    // Extract base URL (remove /mcp path if present)
    const baseUrl = cloudUrl.replace(/\/mcp\/?$/, '');
    const accountName = `session:${baseUrl}`;
    return keytar.getPassword(SERVICE_NAME, accountName);
}
/**
 * Create an HTTP client transport with auth header from keychain.
 * Reads token fresh on each request to pick up re-authentication.
 */
function createAuthenticatedTransport(cloudUrl) {
    const url = new URL(cloudUrl);
    // Create a custom fetch that adds auth header dynamically
    const fetchWithAuth = async (input, init) => {
        const token = await getSessionToken(cloudUrl);
        const headers = new Headers(init?.headers);
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(input, {
            ...init,
            headers
        });
    };
    return new StreamableHTTPClientTransport(url, {
        fetch: fetchWithAuth
    });
}
/**
 * Proxy server that bridges STDIO transport (from Claude Code) to
 * HTTP transport (to cloud server) with dynamic auth from keychain.
 */
export class ProxyServer {
    stdioTransport;
    httpTransport;
    isShuttingDown = false;
    constructor(cloudUrl = DEFAULT_CLOUD_URL) {
        this.stdioTransport = new StdioServerTransport();
        this.httpTransport = createAuthenticatedTransport(cloudUrl);
    }
    async run() {
        // Set up message forwarding: STDIO -> HTTP
        this.stdioTransport.onmessage = async (message) => {
            if (this.isShuttingDown)
                return;
            try {
                await this.httpTransport.send(message);
            }
            catch (error) {
                // Forward error to Claude Code
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Proxy error forwarding to cloud: ${errorMessage}`);
                // Extract request ID (may be undefined for notifications)
                const requestId = message.id;
                // Determine if this is an auth error using typed error or status code
                const isAuthError = this.isAuthenticationError(error);
                const errorResponse = {
                    jsonrpc: '2.0',
                    id: requestId ?? null,
                    error: {
                        code: isAuthError ? -32000 : -32603,
                        message: isAuthError
                            ? 'Authentication required. Run: npx github:AEGISnetinc/TS-MCP login'
                            : `Cloud server error: ${errorMessage}`
                    }
                };
                await this.stdioTransport.send(errorResponse);
            }
        };
        // Set up message forwarding: HTTP -> STDIO
        this.httpTransport.onmessage = async (message) => {
            if (this.isShuttingDown)
                return;
            try {
                await this.stdioTransport.send(message);
            }
            catch (error) {
                console.error('Proxy error forwarding to Claude Code:', error);
            }
        };
        // Handle transport errors
        this.stdioTransport.onerror = (error) => {
            console.error('STDIO transport error:', error);
        };
        this.httpTransport.onerror = (error) => {
            console.error('HTTP transport error:', error);
        };
        // Handle transport close
        this.stdioTransport.onclose = () => {
            if (!this.isShuttingDown) {
                this.shutdown().catch(console.error);
            }
        };
        this.httpTransport.onclose = () => {
            if (!this.isShuttingDown) {
                this.shutdown().catch(console.error);
            }
        };
        // Start both transports
        await Promise.all([
            this.stdioTransport.start(),
            this.httpTransport.start()
        ]);
    }
    async shutdown() {
        if (this.isShuttingDown)
            return;
        this.isShuttingDown = true;
        await Promise.all([
            this.stdioTransport.close(),
            this.httpTransport.close()
        ]);
    }
    /**
     * Determine if an error is an authentication error.
     * Uses typed StreamableHTTPError when available, falls back to message parsing.
     */
    isAuthenticationError(error) {
        // Check for typed HTTP error with status code
        if (error instanceof StreamableHTTPError) {
            return error.code === 401 || error.code === 403;
        }
        // Fallback to message parsing for other error types
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return message.includes('401') ||
                message.includes('403') ||
                message.includes('unauthorized') ||
                message.includes('authentication');
        }
        return false;
    }
}
/**
 * Run the proxy server.
 */
export async function runProxyServer(cloudUrl) {
    const proxy = new ProxyServer(cloudUrl);
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await proxy.shutdown();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await proxy.shutdown();
        process.exit(0);
    });
    await proxy.run();
}
//# sourceMappingURL=proxy-server.js.map