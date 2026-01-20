// tests/unit/db-client.test.ts
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock pg before importing
jest.unstable_mockModule('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    end: jest.fn()
  }))
}));

describe('DatabaseClient', () => {
  beforeEach(() => {
    process.env.DATABASE_URL = 'postgres://test:test@localhost/testdb';
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('creates a pool with the database URL', async () => {
    const { Pool } = await import('pg');
    const { DatabaseClient } = await import('../../src/db/client.js');

    const client = new DatabaseClient();

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://test:test@localhost/testdb'
    });
  });

  it('executes queries through the pool', async () => {
    const { DatabaseClient } = await import('../../src/db/client.js');
    const client = new DatabaseClient();

    const mockResult = { rows: [{ id: 1 }] };
    (client as any).pool.query.mockResolvedValue(mockResult);

    const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);

    expect(result).toEqual(mockResult);
  });

  it('closes the pool on shutdown', async () => {
    const { DatabaseClient } = await import('../../src/db/client.js');
    const client = new DatabaseClient();

    await client.close();

    expect((client as any).pool.end).toHaveBeenCalled();
  });
});
