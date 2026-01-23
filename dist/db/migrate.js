// src/db/migrate.ts
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseClient } from './client.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function runMigrations(client) {
    const migrationPath = join(__dirname, 'migrations', '001_initial.sql');
    const sql = readFileSync(migrationPath, 'utf-8');
    await client.query(sql);
}
// Allow running directly: npx ts-node src/db/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
    const client = new DatabaseClient();
    runMigrations(client)
        .then(() => {
        console.log('Migrations complete');
        return client.close();
    })
        .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map