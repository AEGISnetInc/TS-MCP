// src/server/http-server.ts
import express, { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';

import { DatabaseClient } from '../db/client.js';
import { UserRepository } from '../db/users.js';
import { SessionRepository } from '../db/sessions.js';
import { TouchstoneClient } from '../touchstone/client.js';
import { CloudAuthProvider } from '../auth/cloud-auth-provider.js';
import { AuthService } from './auth-service.js';
import { TSMCPServer } from './mcp-server.js';
import { getConfig } from '../utils/config.js';

export interface HttpServerDependencies {
  db: DatabaseClient;
  touchstoneClient: TouchstoneClient;
}

export function createHttpServer(deps: HttpServerDependencies) {
  const app = express();
  const config = getConfig();

  // Repositories
  const userRepo = new UserRepository(deps.db);
  const sessionRepo = new SessionRepository(deps.db);

  // Services
  const authService = new AuthService(
    userRepo,
    sessionRepo,
    deps.touchstoneClient,
    config.sessionTtlDays
  );
  const authProvider = new CloudAuthProvider(sessionRepo);

  // MCP Server
  const mcpServer = new TSMCPServer(authProvider);

  // Middleware
  app.use(express.json());

  // Extract session token from Authorization header
  const extractSessionToken = (req: Request): string | undefined => {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return undefined;
  };

  // Auth routes
  app.post('/auth/login', async (req: Request, res: Response) => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json({ error: message });
    }
  });

  app.post('/auth/logout', async (req: Request, res: Response) => {
    try {
      const sessionToken = extractSessionToken(req);
      if (!sessionToken) {
        res.status(401).json({ error: 'No session token provided' });
        return;
      }

      const success = await authService.logout(sessionToken);
      if (success) {
        res.json({ message: 'Logged out successfully' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  app.get('/auth/status', async (req: Request, res: Response) => {
    try {
      const sessionToken = extractSessionToken(req);
      if (!sessionToken) {
        res.json({ valid: false });
        return;
      }

      const status = await authService.getSessionStatus(sessionToken);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Status check failed' });
    }
  });

  // MCP endpoint using Streamable HTTP transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });

  // Connect MCP server to transport
  mcpServer.connectTransport(transport);

  app.all('/mcp', async (req: Request, res: Response) => {
    await transport.handleRequest(req, res, req.body);
  });

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
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
