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
export declare class SessionRepository {
    private readonly db;
    constructor(db: DatabaseClient);
    create(params: CreateSessionParams): Promise<Session>;
    findByToken(sessionToken: string): Promise<Session | null>;
    deleteByToken(sessionToken: string): Promise<boolean>;
    updateLastUsed(sessionToken: string): Promise<void>;
    deleteExpired(): Promise<number>;
    findByUserId(userId: string): Promise<Session[]>;
    deleteByUserId(userId: string): Promise<number>;
}
//# sourceMappingURL=sessions.d.ts.map