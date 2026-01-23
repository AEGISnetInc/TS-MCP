export class SessionRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(params) {
        const result = await this.db.query(`INSERT INTO sessions (user_id, session_token, api_key_enc, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '1 day' * $4)
       RETURNING id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at`, [params.userId, params.sessionToken, params.apiKeyEncrypted, params.ttlDays]);
        return result.rows[0];
    }
    async findByToken(sessionToken) {
        const result = await this.db.query(`SELECT id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at
       FROM sessions
       WHERE session_token = $1 AND expires_at > NOW()`, [sessionToken]);
        return result.rows[0] ?? null;
    }
    async deleteByToken(sessionToken) {
        const result = await this.db.query('DELETE FROM sessions WHERE session_token = $1', [sessionToken]);
        return (result.rowCount ?? 0) > 0;
    }
    async updateLastUsed(sessionToken) {
        await this.db.query('UPDATE sessions SET last_used_at = NOW() WHERE session_token = $1', [sessionToken]);
    }
    async deleteExpired() {
        const result = await this.db.query('DELETE FROM sessions WHERE expires_at <= NOW()', []);
        return result.rowCount ?? 0;
    }
    async findByUserId(userId) {
        const result = await this.db.query(`SELECT id, user_id, session_token, api_key_enc, created_at, expires_at, last_used_at
       FROM sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`, [userId]);
        return result.rows;
    }
    async deleteByUserId(userId) {
        const result = await this.db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
        return result.rowCount ?? 0;
    }
}
//# sourceMappingURL=sessions.js.map