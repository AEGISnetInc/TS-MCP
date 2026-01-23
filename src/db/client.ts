// src/db/client.ts
import { Pool, QueryResult, QueryResultRow } from 'pg';
import { getConfig } from '../utils/config.js';

export class DatabaseClient {
  private pool: Pool;

  constructor() {
    const config = getConfig();
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    // Determine SSL mode:
    // - Fly internal (.flycast) doesn't use SSL
    // - External connections (Railway, etc.) need SSL
    const isInternalFly = config.databaseUrl.includes('.flycast');
    const hasSSLInUrl = config.databaseUrl.includes('sslmode=');

    const ssl = isInternalFly ? false :
                hasSSLInUrl ? undefined :
                { rejectUnauthorized: false };

    this.pool = new Pool({
      connectionString: config.databaseUrl,
      ssl
    });
  }

  async query<T extends QueryResultRow = any>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
