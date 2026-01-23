export class UserRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findByTouchstoneUser(touchstoneUser) {
        const result = await this.db.query('SELECT id, touchstone_user, created_at, last_login_at FROM users WHERE touchstone_user = $1', [touchstoneUser]);
        return result.rows[0] ?? null;
    }
    async create(touchstoneUser) {
        const result = await this.db.query('INSERT INTO users (touchstone_user) VALUES ($1) RETURNING id, touchstone_user, created_at, last_login_at', [touchstoneUser]);
        return result.rows[0];
    }
    async findOrCreate(touchstoneUser) {
        const existing = await this.findByTouchstoneUser(touchstoneUser);
        if (existing) {
            return existing;
        }
        return this.create(touchstoneUser);
    }
    async updateLastLogin(userId) {
        await this.db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
    }
}
//# sourceMappingURL=users.js.map