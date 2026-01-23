import { DatabaseClient } from './client.js';
export interface User {
    id: string;
    touchstone_user: string;
    created_at: Date;
    last_login_at: Date | null;
}
export declare class UserRepository {
    private readonly db;
    constructor(db: DatabaseClient);
    findByTouchstoneUser(touchstoneUser: string): Promise<User | null>;
    create(touchstoneUser: string): Promise<User>;
    findOrCreate(touchstoneUser: string): Promise<User>;
    updateLastLogin(userId: string): Promise<void>;
}
//# sourceMappingURL=users.d.ts.map