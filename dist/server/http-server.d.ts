import { DatabaseClient } from '../db/client.js';
import { TouchstoneClient } from '../touchstone/client.js';
export interface HttpServerDependencies {
    db: DatabaseClient;
    touchstoneClient: TouchstoneClient;
}
export declare function createHttpServer(deps: HttpServerDependencies): {
    app: import("express-serve-static-core").Express;
    close(): Promise<void>;
};
//# sourceMappingURL=http-server.d.ts.map