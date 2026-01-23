// src/server/http-server.ts
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import { UserRepository } from '../db/users.js';
import { SessionRepository } from '../db/sessions.js';
import { CloudAuthProvider } from '../auth/cloud-auth-provider.js';
import { AuthService } from './auth-service.js';
import { TSMCPServer } from './mcp-server.js';
import { getConfig } from '../utils/config.js';
export function createHttpServer(deps) {
    const app = express();
    const config = getConfig();
    // Repositories
    const userRepo = new UserRepository(deps.db);
    const sessionRepo = new SessionRepository(deps.db);
    // Services
    const authService = new AuthService(userRepo, sessionRepo, deps.touchstoneClient, config.sessionTtlDays);
    const authProvider = new CloudAuthProvider(sessionRepo);
    // MCP Server
    const mcpServer = new TSMCPServer(authProvider);
    // Middleware
    app.use(express.json());
    // Extract session token from Authorization header
    const extractSessionToken = (req) => {
        const auth = req.headers.authorization;
        if (auth?.startsWith('Bearer ')) {
            return auth.slice(7);
        }
        return undefined;
    };
    // Auth routes
    app.post('/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                res.status(400).json({ error: 'Username and password required' });
                return;
            }
            const result = await authService.login(username, password);
            res.json({
                sessionToken: result.sessionToken,
                expiresAt: result.expiresAt.toISOString(),
                user: result.touchstoneUser
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            res.status(401).json({ error: message });
        }
    });
    app.post('/auth/logout', async (req, res) => {
        try {
            const sessionToken = extractSessionToken(req);
            if (!sessionToken) {
                res.status(401).json({ error: 'No session token provided' });
                return;
            }
            const success = await authService.logout(sessionToken);
            if (success) {
                res.json({ message: 'Logged out successfully' });
            }
            else {
                res.status(404).json({ error: 'Session not found' });
            }
        }
        catch (error) {
            res.status(500).json({ error: 'Logout failed' });
        }
    });
    app.get('/auth/status', async (req, res) => {
        try {
            const sessionToken = extractSessionToken(req);
            if (!sessionToken) {
                res.json({ valid: false });
                return;
            }
            const status = await authService.getSessionStatus(sessionToken);
            res.json(status);
        }
        catch (error) {
            res.status(500).json({ error: 'Status check failed' });
        }
    });
    // MCP endpoint using Streamable HTTP transport
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID()
    });
    // Connect MCP server to transport
    mcpServer.connectTransport(transport);
    app.all('/mcp', async (req, res) => {
        // Extract session token and attach as AuthInfo for MCP SDK
        const sessionToken = extractSessionToken(req);
        if (sessionToken) {
            const authInfo = {
                token: sessionToken,
                clientId: 'ts-mcp-session', // Required by AuthInfo interface
                scopes: [] // Required by AuthInfo interface
            };
            // Attach to request for transport to pass to handlers
            req.auth = authInfo;
        }
        await transport.handleRequest(req, res, req.body);
    });
    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok' });
    });
    return {
        app,
        async close() {
            await transport.close();
            await mcpServer.shutdown();
        }
    };
}
//# sourceMappingURL=http-server.js.map