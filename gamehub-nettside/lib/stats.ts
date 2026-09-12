/** Everything the admin dashboard shows, from the four statistics tables. */
import { ensureSchema, sql } from '@/lib/db';

export interface Count {
  name: string;
  count: number;
}
export interface DayCount {
  day: string;
  count: number;
}
export interface Stats {
  generatedAt: string;
  installs: { total: number; today: number; week: number; month: number };
  now: { active: number; open: number; tray: number; playing: number; playingGames: Count[] };
  active: { today: number; week: number; month: number };
  retention: { weekBack: number; weekBackOf: number };
  dailyActive: DayCount[];
  newInstalls: DayCount[];
  versions: Count[];
  languages: Count[];
  countries: Count[];
  os: Count[];
  launchers: Count[];
  gamesWeek: Count[];
  gamesAll: Count[];
  featuresWeek: Count[];
  featuresAll: Count[];
  featuresDaily: { day: string; kind: string; count: number }[];
  libraryAverage: number;
}

const ACTIVE_WINDOW = '10 minutes';

function counts(rows: any[], name = 'name'): Count[] {
  return rows.map((r) => ({ name: String(r[name] ?? ''), count: Number(r.count ?? 0) }));
}
function dayCounts(rows: any[]): DayCount[] {
  return rows.map((r) => ({ day: String(r.day).slice(0, 10), count: Number(r.count ?? 0) }));
}
function num(rows: any[], key = 'count'): number {
  return Number(rows[0]?.[key] ?? 0);
}

export async function stats(): Promise<Stats> {
  await ensureSchema();
  const q = sql();

  const [
    total, today, week, month,
    now, playingGames,
    aToday, aWeek, aMonth,
    retention,
    dailyActive, newInstalls,
    versions, languages, countries, os, launchers,
    gamesWeek, gamesAll,
    featuresWeek, featuresAll, featuresDaily,
    library,
  ] = await Promise.all([
    q`SELECT count(*)::int AS count FROM installs`,
    q`SELECT count(*)::int AS count FROM installs WHERE first_seen >= CURRENT_DATE`,
    q`SELECT count(*)::int AS count FROM installs WHERE first_seen >= now() - interval '7 days'`,
    q`SELECT count(*)::int AS count FROM installs WHERE first_seen >= now() - interval '30 days'`,
    q`SELECT count(*)::int AS active,
             count(*) FILTER (WHERE state = 'open')::int AS open,
             count(*) FILTER (WHERE state = 'tray')::int AS tray,
             count(*) FILTER (WHERE playing IS NOT NULL)::int AS playing
      FROM installs WHERE last_seen >= now() - interval '10 minutes'`,
    q`SELECT playing AS name, count(*)::int AS count FROM installs
      WHERE last_seen >= now() - interval '10 minutes' AND playing IS NOT NULL
      GROUP BY playing ORDER BY count DESC, name LIMIT 10`,
    q`SELECT count(DISTINCT install_id)::int AS count FROM activity WHERE day = CURRENT_DATE`,
    q`SELECT count(DISTINCT install_id)::int AS count FROM activity WHERE day >= CURRENT_DATE - 6`,
    q`SELECT count(DISTINCT install_id)::int AS count FROM activity WHERE day >= CURRENT_DATE - 29`,
    q`SELECT count(*)::int AS of,
             count(*) FILTER (WHERE last_seen >= first_seen + interval '7 days')::int AS back
      FROM installs WHERE first_seen < now() - interval '7 days'`,
    q`SELECT to_char(d::date, 'YYYY-MM-DD') AS day, coalesce(a.count, 0)::int AS count
      FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') AS d
      LEFT JOIN (SELECT day, count(DISTINCT install_id) AS count FROM activity WHERE day >= CURRENT_DATE - 29 GROUP BY day) a ON a.day = d::date
      ORDER BY d`,
    q`SELECT to_char(d::date, 'YYYY-MM-DD') AS day, coalesce(i.count, 0)::int AS count
      FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') AS d
      LEFT JOIN (SELECT first_seen::date AS day, count(*) AS count FROM installs WHERE first_seen >= CURRENT_DATE - 29 GROUP BY 1) i ON i.day = d::date
      ORDER BY d`,
    q`SELECT version AS name, count(*)::int AS count FROM installs WHERE last_seen >= now() - interval '30 days' GROUP BY version ORDER BY count DESC LIMIT 12`,
    q`SELECT language AS name, count(*)::int AS count FROM installs GROUP BY language ORDER BY count DESC LIMIT 12`,
    q`SELECT country AS name, count(*)::int AS count FROM installs WHERE country <> '' GROUP BY country ORDER BY count DESC LIMIT 15`,
    q`SELECT os AS name, count(*)::int AS count FROM installs WHERE os <> '' GROUP BY os ORDER BY count DESC LIMIT 8`,
    q`SELECT l AS name, count(*)::int AS count FROM installs, unnest(launchers) AS l GROUP BY l ORDER BY count DESC`,
    q`SELECT game AS name, count(DISTINCT install_id)::int AS count FROM plays WHERE day >= CURRENT_DATE - 6 GROUP BY game ORDER BY count DESC, name LIMIT 15`,
    q`SELECT game AS name, count(DISTINCT install_id)::int AS count FROM plays GROUP BY game ORDER BY count DESC, name LIMIT 15`,
    q`SELECT kind AS name, sum(count)::int AS count FROM events WHERE day >= CURRENT_DATE - 6 GROUP BY kind ORDER BY count DESC`,
    q`SELECT kind AS name, sum(count)::int AS count FROM events GROUP BY kind ORDER BY count DESC`,
    q`SELECT to_char(day, 'YYYY-MM-DD') AS day, kind, count FROM events WHERE day >= CURRENT_DATE - 29 ORDER BY day`,
    q`SELECT coalesce(avg(games), 0)::float AS avg FROM installs WHERE games > 0`,
  ]);

  return {
    generatedAt: new Date().toISOString(),
    installs: { total: num(total), today: num(today), week: num(week), month: num(month) },
    now: {
      active: num(now, 'active'),
      open: num(now, 'open'),
      tray: num(now, 'tray'),
      playing: num(now, 'playing'),
      playingGames: counts(playingGames),
    },
    active: { today: num(aToday), week: num(aWeek), month: num(aMonth) },
    retention: { weekBack: num(retention, 'back'), weekBackOf: num(retention, 'of') },
    dailyActive: dayCounts(dailyActive),
    newInstalls: dayCounts(newInstalls),
    versions: counts(versions),
    languages: counts(languages),
    countries: counts(countries),
    os: counts(os),
    launchers: counts(launchers),
    gamesWeek: counts(gamesWeek),
    gamesAll: counts(gamesAll),
    featuresWeek: counts(featuresWeek),
    featuresAll: counts(featuresAll),
    featuresDaily: featuresDaily.map((r: any) => ({ day: String(r.day).slice(0, 10), kind: String(r.kind), count: Number(r.count) })),
    libraryAverage: Math.round(num(library, 'avg')),
  };
}

export const ACTIVE_WINDOW_LABEL = ACTIVE_WINDOW;
