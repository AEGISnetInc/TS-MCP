import { QueryResult, QueryResultRow } from 'pg';
export declare class DatabaseClient {
    private pool;
    constructor();
    query<T extends QueryResultRow = any>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
    close(): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map