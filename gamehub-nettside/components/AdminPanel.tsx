'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Release, Run } from '@/lib/github';
import { formatBytes, formatDate } from '@/lib/format';

async function call(path: string, body: unknown): Promise<void> {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? `Feil ${res.status}`);
}

function runState(run: Run): { cls: string; text: string } {
  if (run.status !== 'completed') return { cls: 'warn', text: run.status === 'queued' ? 'I kø' : 'Bygger …' };
  if (run.conclusion === 'success') return { cls: 'ok', text: 'Ferdig' };
  if (run.conclusion === 'cancelled') return { cls: '', text: 'Avbrutt' };
  return { cls: 'danger', text: 'Feilet' };
}

/**
 * The admin panel. Everything here is a thin front on GitHub: publishing is a
 * version bump, notes are the release body, hiding is the pre-release flag.
 */
export function AdminPanel({
  repo,
  hasToken,
  releases,
  runs,
  currentVersion,
  suggested,
  error,
}: {
  repo: string;
  hasToken: boolean;
  releases: Release[];
  runs: Run[];
  currentVersion: string;
  suggested: string;
  error: string | null;
}) {
  const router = useRouter();
  const [version, setVersion] = useState(suggested);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const building = runs.find((r) => r.status !== 'completed');
  const pending = building && !releases.some((r) => r.version === currentVersion);

  const act = async (key: string, work: () => Promise<void>, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      await work();
      setMessage({ kind: 'ok', text: done });
      router.refresh();
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="row" style={{ margin: '10px 0 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin</h1>
        <span className="pill accent">{repo}</span>
        <span className="spacer" />
        <button className="btn sm btn-ghost" onClick={() => router.refresh()}>
          ↻ Oppdater
        </button>
        <form method="post" action="/api/admin/logout">
          <button className="btn sm btn-ghost" type="submit">
            Logg ut
          </button>
        </form>
      </div>

      {!hasToken && (
        <div className="notice">
          <strong>GITHUB_TOKEN mangler.</strong> Du kan se versjonene, men ikke publisere, skjule eller endre notater før den
          er lagt inn i Vercel. Se OPPSKRIFT-NETTSIDE.md, del 3.
        </div>
      )}
      {error && <div className="notice danger">{error}</div>}
      {message && <div className={`notice ${message.kind}`}>{message.text}</div>}

      <div className="admin-grid">
        <div className="card glow">
          <h3>Publiser ny versjon</h3>
          <p className="notes" style={{ marginTop: 0, marginBottom: 14 }}>
            Appen ligger på versjon <strong>{currentVersion || '?'}</strong>. Trykker du Publiser, endrer nettsiden
            versjonstallet i GitHub for deg. GitHub bygger så installeren (10–15 min), legger den ut her, og alle som har
            GameHub får beskjed om oppdateringen.
          </p>
          {pending && (
            <div className="notice info">
              Versjon {currentVersion} bygges akkurat nå. Vent til den er ferdig før du publiserer en ny.
            </div>
          )}
          <div className="field">
            <label htmlFor="version">Versjonsnummer</label>
            <input id="version" type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder={suggested} />
            <span className="hint">Må være høyere enn {currentVersion || 'den forrige'}. Forslag: {suggested}</span>
          </div>
          <div className="field">
            <label htmlFor="notes">Hva er nytt? (vises på nettsiden og i popupen i appen)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'- Replay tar nå opp lyd\n- Fikset at F7 ikke virket i noen spill\n\nEn linje som begynner med - blir et kulepunkt.'}
            />
          </div>
          <button
            className={`btn btn-accent${busy === 'publish' ? ' busy' : ''}`}
            disabled={!hasToken || busy !== null || Boolean(pending)}
            onClick={() =>
              act(
                'publish',
                () => call('/api/admin/publish', { version: version.trim(), notes }),
                `Versjon ${version.trim()} er sendt til GitHub. Følg med under «Bygging» — om 10–15 minutter ligger den ute.`,
              ).then(() => setNotes(''))
            }
          >
            🚀 Publiser {version.trim() || suggested}
          </button>
        </div>

        <div className="card">
          <h3>Bygging</h3>
          {runs.length === 0 ? (
            <p className="notes" style={{ marginTop: 0 }}>
              Ingen bygg ennå.
            </p>
          ) : (
            runs.map((run) => {
              const state = runState(run);
              return (
                <div className="run" key={run.id}>
                  <span className={`dot ${state.cls}`} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.name}</span>
                  <span className={`pill ${state.cls}`}>{state.text}</span>
                  <a className="btn sm btn-ghost" href={run.url} target="_blank" rel="noopener">
                    Åpne
                  </a>
                </div>
              );
            })
          )}
          <p className="hint" style={{ marginTop: 10, color: 'var(--faint)', fontSize: 13 }}>
            Rødt? Åpne raden på GitHub og les det røde steget — det sier hva som mangler.
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 12px' }}>Versjoner som ligger ute</h2>
      {releases.length === 0 ? (
        <p className="empty">Ingen versjoner ennå. Den første kommer når bygget over er ferdig.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {releases.map((release, i) => (
            <div className="card" key={release.id} style={{ ['--i' as string]: i }}>
              <div className="row">
                <strong style={{ fontSize: 17 }}>GameHub {release.version}</strong>
                {i === 0 && !release.prerelease && <span className="pill ok">Nyeste</span>}
                {release.prerelease && <span className="pill warn">Skjult — vises ikke, og appen tilbyr den ikke</span>}
                {!release.installer && <span className="pill danger">Mangler installer</span>}
                <span className="spacer" />
                <span style={{ color: 'var(--faint)', fontSize: 13 }}>
                  {formatDate(release.publishedAt)}
                  {release.installer ? ` · ${formatBytes(release.installer.size)} · ${release.installer.downloads} nedlastinger` : ''}
                </span>
              </div>

              {editing === release.id ? (
                <div style={{ marginTop: 12 }}>
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <div className="row" style={{ marginTop: 8 }}>
                    <button
                      className={`btn sm btn-accent${busy === `notes-${release.id}` ? ' busy' : ''}`}
                      disabled={busy !== null}
                      onClick={() =>
                        act(`notes-${release.id}`, () => call('/api/admin/notes', { id: release.id, body: draft }), 'Notatene er lagret.').then(() =>
                          setEditing(null),
                        )
                      }
                    >
                      Lagre
                    </button>
                    <button className="btn sm btn-ghost" onClick={() => setEditing(null)}>
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <p className="notes" style={{ whiteSpace: 'pre-wrap' }}>
                  {release.body.trim() || 'Ingen notater.'}
                </p>
              )}

              <div className="row" style={{ marginTop: 12 }}>
                {release.installer && (
                  <a className="btn sm" href={release.installer.downloadUrl}>
                    ⬇ Last ned
                  </a>
                )}
                <button
                  className="btn sm btn-ghost"
                  disabled={!hasToken || busy !== null}
                  onClick={() => {
                    setDraft(release.body);
                    setEditing(release.id);
                  }}
                >
                  ✏️ Endre notater
                </button>
                <button
                  className={`btn sm btn-ghost${busy === `vis-${release.id}` ? ' busy' : ''}`}
                  disabled={!hasToken || busy !== null}
                  onClick={() =>
                    act(
                      `vis-${release.id}`,
                      () => call('/api/admin/visibility', { id: release.id, hidden: !release.prerelease }),
                      release.prerelease ? `${release.version} vises igjen.` : `${release.version} er skjult. Folk får den forrige i stedet.`,
                    )
                  }
                >
                  {release.prerelease ? '👁 Vis igjen' : '🙈 Skjul'}
                </button>
                <a className="btn sm btn-ghost" href={release.url} target="_blank" rel="noopener">
                  GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
