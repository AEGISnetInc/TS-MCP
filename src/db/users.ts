// src/db/users.ts
import { DatabaseClient } from './client.js';

export interface User {
  id: string;
  touchstone_user: string;
  created_at: Date;
  last_login_at: Date | null;
}

export class UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findByTouchstoneUser(touchstoneUser: string): Promise<User | null> {
    const result = await this.db.query<User>(
      'SELECT id, touchstone_user, created_at, last_login_at FROM users WHERE touchstone_user = $1',
      [touchstoneUser]
    );
    return result.rows[0] ?? null;
  }

  async create(touchstoneUser: string): Promise<User> {
    const result = await this.db.query<User>(
      'INSERT INTO users (touchstone_user) VALUES ($1) RETURNING id, touchstone_user, created_at, last_login_at',
      [touchstoneUser]
    );
    return result.rows[0];
  }

  async findOrCreate(touchstoneUser: string): Promise<User> {
    const existing = await this.findByTouchstoneUser(touchstoneUser);
    if (existing) {
      return existing;
    }
    return this.create(touchstoneUser);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [userId]
    );
  }
}
