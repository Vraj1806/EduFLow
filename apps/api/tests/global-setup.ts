import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Recreates the test database schema before the suite runs.
 *
 * Instead of `prisma db push --force-reset` (which Prisma 6.19 gates behind an
 * interactive consent prompt for dev databases), we delete the SQLite files
 * first — the test DB is disposable — then push the schema fresh.
 */
export default function setup() {
  for (const file of ['test.db', 'test.db-journal', 'test.db-wal', 'test.db-shm']) {
    rmSync(path.join(apiRoot, 'prisma', file), { force: true });
  }

  execSync('npx --no-install prisma db push --skip-generate', {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'inherit',
  });
}
