// Applies one or more deep_cases migrations twice in an in-memory Postgres and prints row counts per market.
// Usage (from any folder with @electric-sql/pglite installed):
//   node scripts/cases/pgcheck.mjs drizzle/migrations/0038_aerospace_deep_cases.sql [more.sql ...]
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const MARKETS = ['aerospace', 'ai', 'biotech', 'fintech', 'neuroscience', 'agtech', 'cleanenergy', 'climatetech',
  'cybersecurity', 'ev', 'healthtech', 'logistics', 'robotics', 'spacetech', 'web3'];
const db = new PGlite();
await db.exec(`CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE TABLE markets (id text PRIMARY KEY, name text);
  INSERT INTO markets VALUES ${MARKETS.map(m => `('${m}', '${m}')`).join(', ')};`);
for (const f of process.argv.slice(2)) {
  const sql = fs.readFileSync(f, 'utf8').replace(/NOTIFY pgrst[^;]*;/, '');
  await db.exec(sql);
  await db.exec(sql); // must be safe to run twice
}
const counts = await db.query(`SELECT market_id, count(*)::int AS cases, min(day) AS first_day, max(day) AS last_day,
  count(DISTINCT slot)::int AS slots FROM deep_cases GROUP BY market_id ORDER BY market_id`);
const policies = await db.query(`SELECT policyname FROM pg_policies WHERE tablename = 'deep_cases'`);
console.log(JSON.stringify({ counts: counts.rows, policies: policies.rows.map(p => p.policyname) }, null, 1));
