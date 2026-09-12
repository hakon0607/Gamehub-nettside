/**
 * The statistics database: Neon Postgres, created with one click in Vercel
 * (Storage → Create Database → Neon). Vercel sets DATABASE_URL by itself.
 *
 * Four small tables, all created on first use — no migrations to run:
 *   installs  one row per GameHub install (random id made by the app)
 *   activity  one row per install per day it was seen
 *   plays     one row per install per game per day
 *   events    feature use, summed per day
 */
import { neon } from '@neondatabase/serverless';
import { Pool } from 'pg';

export const configured = Boolean(process.env.DATABASE_URL);

/** A tagged template: sql()`SELECT ... ${value}` → rows. */
export type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<any[]>;

let pool: Pool | null = null;

/**
 * Neon's HTTP driver on Vercel (no connection to keep alive between
 * requests); plain `pg` for any other Postgres, including a local one in
 * tests. Same tagged-template call either way.
 */
export function sql(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set — create a Neon database under Storage in Vercel');
  if (/neon\.tech/.test(url)) return neon(url) as unknown as Sql;
  pool ??= new Pool({ connectionString: url, max: 3 });
  const p = pool;
  return async (strings, ...values) => {
    const text = strings.reduce((acc, part, i) => acc + part + (i < values.length ? `$${i + 1}` : ''), '');
    const { rows } = await p.query(text, values as any[]);
    return rows;
  };
}

let ready: Promise<void> | null = null;

/** Creates the tables if they are missing. Runs once per server instance. */
export function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const q = sql();
      await q`CREATE TABLE IF NOT EXISTS installs (
        id text PRIMARY KEY,
        first_seen timestamptz NOT NULL DEFAULT now(),
        last_seen timestamptz NOT NULL DEFAULT now(),
        version text NOT NULL DEFAULT '',
        language text NOT NULL DEFAULT '',
        country text NOT NULL DEFAULT '',
        os text NOT NULL DEFAULT '',
        state text NOT NULL DEFAULT 'open',
        playing text,
        games int NOT NULL DEFAULT 0,
        launchers text[] NOT NULL DEFAULT '{}',
        pings int NOT NULL DEFAULT 0
      )`;
      await q`CREATE TABLE IF NOT EXISTS activity (
        install_id text NOT NULL,
        day date NOT NULL,
        PRIMARY KEY (install_id, day)
      )`;
      await q`CREATE TABLE IF NOT EXISTS plays (
        install_id text NOT NULL,
        day date NOT NULL,
        game text NOT NULL,
        PRIMARY KEY (install_id, day, game)
      )`;
      await q`CREATE TABLE IF NOT EXISTS events (
        day date NOT NULL,
        kind text NOT NULL,
        count int NOT NULL DEFAULT 0,
        PRIMARY KEY (day, kind)
      )`;
      await q`CREATE INDEX IF NOT EXISTS installs_last_seen ON installs (last_seen)`;
      await q`CREATE INDEX IF NOT EXISTS activity_day ON activity (day)`;
      await q`CREATE INDEX IF NOT EXISTS plays_day ON plays (day)`;
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}
