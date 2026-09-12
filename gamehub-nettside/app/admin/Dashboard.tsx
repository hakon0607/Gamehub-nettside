'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Count, DayCount, Stats } from '@/lib/stats';

const REFRESH_MS = 30_000;
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', nb: 'Norsk', sv: 'Svenska', da: 'Dansk', fi: 'Suomi', de: 'Deutsch', fr: 'Français', es: 'Español', pl: 'Polski', nl: 'Nederlands' };
const FEATURE_NAMES: Record<string, string> = { launch: 'Games launched', screenshot: 'Screenshots', clip: 'Replay clips saved', trim: 'Clips trimmed', freeze: 'Games frozen', wallpaper: 'Wallpapers set', quicktools: 'Quick Tools opened' };
const fmt = (n: number) => n.toLocaleString('en-GB');
const pct = (part: number, of: number) => (of > 0 ? `${Math.round((part / of) * 100)}%` : '—');
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function Dashboard({ initial, problem, downloads, versionsPublished }: { initial: Stats | null; problem: string; downloads: number; versionsPublished: number }) {
  const [data, setData] = useState<Stats | null>(initial);
  const [error, setError] = useState(problem);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).reason || `HTTP ${res.status}`);
        const next = (await res.json()) as Stats;
        if (!cancelled) {
          setData(next);
          setError('');
        }
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    };
    const timer = window.setInterval(load, REFRESH_MS);
    const clock = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearInterval(clock);
    };
  }, []);

  const age = data ? Math.max(0, Math.round((Date.now() - new Date(data.generatedAt).getTime()) / 1000)) : 0;
  void tick;

  if (!data) {
    return (
      <div className="card glow" style={{ marginTop: 24 }}>
        <div className="label">Statistics</div>
        <p className="notes" style={{ marginTop: 0 }}>{error || 'Loading…'}</p>
      </div>
    );
  }

  const s = data;
  return (
    <div className="dash">
      <div className="row dash-head">
        <span className="live"><i />live · updated {age}s ago</span>
        <span className="spacer" />
        {error && <span className="hint" style={{ color: 'var(--danger)' }}>{error}</span>}
        <button className="btn sm btn-ghost" onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.reload(); }}>Log out</button>
      </div>

      <section className="tiles">
        <Tile big label="Active right now" value={s.now.active} note={`${fmt(s.now.open)} with the window open · ${fmt(s.now.tray)} in the tray`} />
        <Tile big label="Playing right now" value={s.now.playing} note={s.now.playingGames.slice(0, 3).map((g) => g.name).join(' · ') || 'nobody in a game'} />
        <Tile label="Installs" value={s.installs.total} note={`${fmt(s.installs.today)} today · ${fmt(s.installs.week)} this week · ${fmt(s.installs.month)} this month`} />
        <Tile label="Downloads (GitHub)" value={downloads} note={`${versionsPublished} versions published`} />
        <Tile label="Active today" value={s.active.today} note="unique installs seen today" />
        <Tile label="Active this week" value={s.active.week} note="last 7 days" />
        <Tile label="Active this month" value={s.active.month} note="last 30 days" />
        <Tile label="Still using it a week later" value={pct(s.retention.weekBack, s.retention.weekBackOf)} note={`${fmt(s.retention.weekBack)} of ${fmt(s.retention.weekBackOf)} installs older than a week`} />
        <Tile label="Games per library" value={s.libraryAverage} note="average installed games" />
      </section>

      <Panel title="Active installs per day" sub="unique installs seen each day, last 30 days">
        <LineChart data={s.dailyActive} />
      </Panel>
      <Panel title="New installs per day" sub="first time an install was seen, last 30 days">
        <BarChart data={s.newInstalls} />
      </Panel>

      <div className="grid2">
        <Panel title="Playing right now" sub="games open on active installs">
          <Ranked data={s.now.playingGames} empty="Nobody is in a game right now." />
        </Panel>
        <Panel title="Most played" sub="unique players per game">
          <Toggled a={{ label: '7 days', data: s.gamesWeek }} b={{ label: 'All time', data: s.gamesAll }} />
        </Panel>
        <Panel title="Features used" sub="times a feature was used">
          <Toggled a={{ label: '7 days', data: s.featuresWeek }} b={{ label: 'All time', data: s.featuresAll }} names={FEATURE_NAMES} />
        </Panel>
        <Panel title="Versions" sub="installs seen in the last 30 days">
          <Ranked data={s.versions} of={s.active.month} />
        </Panel>
        <Panel title="Languages" sub="chosen in the app">
          <Ranked data={s.languages} names={LANGUAGE_NAMES} of={s.installs.total} />
        </Panel>
        <Panel title="Countries" sub="from the request, IP never stored">
          <Ranked data={s.countries} names={countryNames()} of={s.installs.total} />
        </Panel>
        <Panel title="Launchers" sub="installs with games from each">
          <Ranked data={s.launchers} of={s.installs.total} />
        </Panel>
        <Panel title="Windows versions" sub="as reported by the app">
          <Ranked data={s.os} of={s.installs.total} />
        </Panel>
      </div>
    </div>
  );
}

function Tile({ label, value, note, big }: { label: string; value: number | string; note?: string; big?: boolean }) {
  return (
    <div className={`card tile${big ? ' tile-big' : ''}`}>
      <div className="label">{label}</div>
      <div className="tile-value">{typeof value === 'number' ? fmt(value) : value}</div>
      {note && <div className="hint">{note}</div>}
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="card panel">
      <div className="panel-head">
        <strong>{title}</strong>
        {sub && <span className="hint">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggled({ a, b, names }: { a: { label: string; data: Count[] }; b: { label: string; data: Count[] }; names?: Record<string, string> }) {
  const [which, setWhich] = useState<'a' | 'b'>('a');
  const pick = which === 'a' ? a : b;
  return (
    <>
      <div className="seg">
        <button className={which === 'a' ? 'on' : ''} onClick={() => setWhich('a')}>{a.label}</button>
        <button className={which === 'b' ? 'on' : ''} onClick={() => setWhich('b')}>{b.label}</button>
      </div>
      <Ranked data={pick.data} names={names} />
    </>
  );
}

/** Horizontal ranked bars: one hue, identity carried by the label. */
function Ranked({ data, names, of, empty = 'Nothing yet.' }: { data: Count[]; names?: Record<string, string>; of?: number; empty?: string }) {
  if (data.length === 0) return <p className="hint" style={{ margin: 0 }}>{empty}</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="ranked">
      {data.map((d) => (
        <div key={d.name} className="ranked-row" title={`${names?.[d.name] ?? d.name}: ${fmt(d.count)}`}>
          <span className="ranked-name">{(names?.[d.name] ?? d.name) || '—'}</span>
          <span className="ranked-bar"><i style={{ width: `${(d.count / max) * 100}%` }} /></span>
          <span className="ranked-count">{fmt(d.count)}{of ? <small> {pct(d.count, of)}</small> : null}</span>
        </div>
      ))}
    </div>
  );
}

/** A 30-day line with a hover crosshair, plus a table view. */
function LineChart({ data }: { data: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 640, H = 180, PL = 34, PR = 10, PT = 12, PB = 26;
  const max = Math.max(...data.map((d) => d.count), 1);
  const x = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * (W - PL - PR);
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ');
  const area = `${path} L${x(data.length - 1).toFixed(1)},${(H - PB).toFixed(1)} L${x(0).toFixed(1)},${(H - PB).toFixed(1)} Z`;
  const ticks = useMemo(() => [0, Math.round(max / 2), max], [max]);
  if (table) return <><ViewToggle table onChange={setTable} /><DayTable data={data} /></>;
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="chart">
      <ViewToggle table={false} onChange={setTable} />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Active installs per day"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          const i = Math.round(((px - PL) / (W - PL - PR)) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PL - 6} y={y(t) + 4} className="axis" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (i % 7 === 0 || (i === data.length - 1 && i % 7 > 3)) && (
          <text key={d.day} x={x(i)} y={H - 8} className="axis" textAnchor="middle">{dayLabel(d.day)}</text>
        ))}
        <path d={area} className="area" />
        <path d={path} className="line" />
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} className="cross" />
            <circle cx={x(hover)} cy={y(h.count)} r={5} className="dot" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <strong>{fmt(h.count)}</strong> active · {dayLabel(h.day)}
        </div>
      )}
    </div>
  );
}

function BarChart({ data }: { data: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 640, H = 160, PL = 34, PR = 10, PT = 12, PB = 26;
  const max = Math.max(...data.map((d) => d.count), 1);
  const slot = (W - PL - PR) / data.length;
  const bw = Math.max(2, slot - 3);
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB);
  if (table) return <><ViewToggle table onChange={setTable} /><DayTable data={data} /></>;
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="chart">
      <ViewToggle table={false} onChange={setTable} />
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="New installs per day" onMouseLeave={() => setHover(null)}>
        {[0, max].map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} className="grid" />
            <text x={PL - 6} y={y(t) + 4} className="axis" textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={d.day} onMouseEnter={() => setHover(i)}>
            <rect x={PL + i * slot} y={PT} width={slot} height={H - PT - PB} fill="transparent" />
            <rect x={PL + i * slot + (slot - bw) / 2} y={y(d.count)} width={bw} height={Math.max(0, H - PB - y(d.count))} rx={3} className={`bar${hover === i ? ' on' : ''}`} />
            {(i % 7 === 0 || (i === data.length - 1 && i % 7 > 3)) && <text x={PL + i * slot + slot / 2} y={H - 8} className="axis" textAnchor="middle">{dayLabel(d.day)}</text>}
          </g>
        ))}
      </svg>
      {h && hover !== null && (
        <div className="tip" style={{ left: `${((PL + hover * slot + slot / 2) / W) * 100}%` }}>
          <strong>{fmt(h.count)}</strong> new · {dayLabel(h.day)}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ table, onChange }: { table: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="seg seg-right">
      <button className={!table ? 'on' : ''} onClick={() => onChange(false)}>Chart</button>
      <button className={table ? 'on' : ''} onClick={() => onChange(true)}>Table</button>
    </div>
  );
}

function DayTable({ data }: { data: DayCount[] }) {
  return (
    <div className="day-table">
      {[...data].reverse().map((d) => (
        <div key={d.day} className="ranked-row"><span className="ranked-name">{dayLabel(d.day)}</span><span className="spacer" /><span className="ranked-count">{fmt(d.count)}</span></div>
      ))}
    </div>
  );
}

function countryNames(): Record<string, string> {
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    return new Proxy({}, { get: (_t, code: string) => (typeof code === 'string' && code.length === 2 ? names.of(code) ?? code : undefined) }) as Record<string, string>;
  } catch {
    return {};
  }
}
