// src/db/sessions.ts
import { DatabaseClient } from './client.js';

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  api_key_enc: string;
  created_at: Date;
  expires_at: Date;
  last_used_at: Date;
}

export interface CreateSessionParams {
  userId: string;
  sessionToken: string;
  apiKeyEncrypted: string;
  ttlDays: number;
}

export class SessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async create(params: CreateSessionParams): Promise<Session> {
    const result = await this.db.query<Session>(
      `INSERT INTO sessions (user_id, session_token, api_key_enc, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 day' * $4)
       RETURNING id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at`,
      [params.userId, params.sessionToken, params.apiKeyEncrypted, params.ttlDays]
    );
    return result.rows[0];
  }

  async findByToken(sessionToken: string): Promise<Session | null> {
    const result = await this.db.query<Session>(
      `SELECT id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at
       FROM sessions
       WHERE session_token = $1 AND expires_at > NOW()`,
      [sessionToken]
    );
    return result.rows[0] ?? null;
  }

  async deleteByToken(sessionToken: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE session_token = $1',
      [sessionToken]
    );
    return (result.rowCount ?? 0) > 0;
  }

  async updateLastUsed(sessionToken: string): Promise<void> {
    await this.db.query(
      'UPDATE sessions SET last_used_at = NOW() WHERE session_token = $1',
      [sessionToken]
    );
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE expires_at <= NOW()',
      []
    );
    return result.rowCount ?? 0;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const result = await this.db.query<Session>(
      `SELECT id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at
       FROM sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [userId]
    );
    return result.rowCount ?? 0;
  }
}
