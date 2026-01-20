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
    this.pool = new Pool({
      connectionString: config.databaseUrl
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
