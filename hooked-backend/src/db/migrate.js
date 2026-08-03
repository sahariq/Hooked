import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', '..', 'migrations');

async function migrate() {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  console.log(`Found ${files.length} migration file(s).`);

  for (const file of files) {
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}...`);
    await pool.query(sql);
  }

  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
