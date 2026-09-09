'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import type { Version } from '@/lib/versions';
import { formatBytes, formatDate } from '@/lib/format';

/** Upload a file, give it a version number, done. */
export function AdminPanel({ versions, suggested, blobReady }: { versions: Version[]; suggested: string; blobReady: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState(suggested);
  const [notes, setNotes] = useState('');
  const [percent, setPercent] = useState<number | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'danger'; text: string } | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const pick = (list: FileList | null) => {
    const chosen = list?.[0] ?? null;
    if (chosen && !chosen.name.toLowerCase().endsWith('.exe')) {
      setMessage({ kind: 'danger', text: 'Velg .exe-filen (GameHub-Setup.exe).' });
      return;
    }
    setMessage(null);
    setFile(chosen);
  };

  const publish = async () => {
    if (!file) return setMessage({ kind: 'danger', text: 'Velg en fil først.' });
    if (!/^\d+\.\d+\.\d+$/.test(version.trim())) return setMessage({ kind: 'danger', text: 'Versjonen må se ut som 1.2.3.' });
    if (versions.some((v) => v.version === version.trim()) && !confirm(`Versjon ${version.trim()} finnes allerede. Erstatte den?`)) return;
    setMessage(null);
    setPercent(0);
    try {
      await upload(`releases/${version.trim()}/GameHub-Setup.exe`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: 'application/octet-stream',
        onUploadProgress: (p) => setPercent(p.percentage),
      });
      const res = await fetch('/api/finish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: version.trim(), notes }) });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? `Feil ${res.status}`);
      setMessage({ kind: 'ok', text: `Versjon ${version.trim()} ligger ute nå. Forsiden er oppdatert.` });
      setFile(null);
      setNotes('');
      if (input.current) input.current.value = '';
      router.refresh();
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setPercent(null);
    }
  };

  const remove = async (v: Version) => {
    if (!confirm(`Slette versjon ${v.version}? Filen forsvinner fra nettsiden.`)) return;
    setBusy(v.version);
    try {
      const res = await fetch('/api/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: v.version }) });
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? `Feil ${res.status}`);
      setMessage({ kind: 'ok', text: `Versjon ${v.version} er slettet.` });
      router.refresh();
    } catch (e) {
      setMessage({ kind: 'danger', text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const uploading = percent !== null;

  return (
    <>
      <div className="row" style={{ margin: '10px 0 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Legg ut ny versjon</h1>
        <span className="spacer" />
        <form method="post" action="/api/logout"><button className="btn sm btn-ghost" type="submit">Logg ut</button></form>
      </div>

      {!blobReady && (
        <div className="notice danger">
          Lagringen er ikke koblet til ennå. I Vercel: <strong>Storage → Create Database → Blob → Connect</strong> til dette prosjektet, så Redeploy. Se oppskriften.
        </div>
      )}
      {message && <div className={`notice ${message.kind}`}>{message.text}</div>}

      <div className="card glow">
        <label
          className={`drop${over ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
        >
          <input ref={input} type="file" accept=".exe" onChange={(e) => pick(e.target.files)} disabled={uploading} />
          {file ? (
            <><strong>{file.name}</strong>{formatBytes(file.size)} · klikk for å velge en annen</>
          ) : (
            <><strong>Slipp GameHub-Setup.exe her</strong>eller klikk for å velge filen</>
          )}
        </label>

        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="version">Versjonsnummer</label>
          <input id="version" type="text" value={version} onChange={(e) => setVersion(e.target.value)} disabled={uploading} />
          <span className="hint">Høyeste tall blir den som vises på forsiden. Forslag: {suggested}</span>
        </div>
        <div className="field">
          <label htmlFor="notes">Hva er nytt? (valgfritt)</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={uploading} placeholder="Replay tar nå opp lyd. Frys spillet med F7." />
        </div>

        {uploading && (
          <>
            <div className="progress"><span style={{ width: `${percent}%` }} /></div>
            <p className="hint">Laster opp … {Math.round(percent ?? 0)} %. Ikke lukk siden.</p>
          </>
        )}

        <button className={`btn btn-accent${uploading ? ' busy' : ''}`} style={{ marginTop: 8 }} disabled={uploading || !blobReady} onClick={() => void publish()}>
          🚀 Legg ut versjon {version.trim() || suggested}
        </button>
      </div>

      <div className="card" style={{ marginTop: 16, ['--i' as string]: 1 }}>
        <div className="label">Versjoner som ligger ute</div>
        {versions.length === 0 ? (
          <p className="notes" style={{ marginTop: 0 }}>Ingen ennå.</p>
        ) : (
          versions.map((v, i) => (
            <div className="version-row" key={v.version}>
              <strong>GameHub {v.version}</strong>
              {i === 0 && <span className="pill">På forsiden</span>}
              <span className="meta">{formatDate(v.uploadedAt)} · {formatBytes(v.size)}</span>
              <span className="spacer" />
              <a className="btn sm btn-ghost" href={v.url}>Last ned</a>
              <button className={`btn sm btn-ghost btn-danger${busy === v.version ? ' busy' : ''}`} disabled={busy !== null || uploading} onClick={() => void remove(v)}>Slett</button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
