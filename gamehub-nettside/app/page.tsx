import { listVersions } from '@/lib/versions';
import { formatBytes, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const versions = await listVersions();
  const latest = versions[0] ?? null;
  const older = versions.slice(1);

  return (
    <>
      <section className="hero">
        <h1>Alle spillene dine.<br />Ett bibliotek.</h1>
        <p>Steam, Epic, Xbox, EA, Ubisoft, Battle.net, GOG og Riot på ett sted. Replay med lyd. Frys spillet midt i en cutscene.</p>
        <div className="cta">
          {latest ? (
            <>
              <a className="btn big btn-accent" href={latest.url} download="GameHub-Setup.exe">⬇ Last ned GameHub {latest.version}</a>
              <small>Windows 10/11 · {formatBytes(latest.size)} · {formatDate(latest.uploadedAt)}</small>
            </>
          ) : (
            <small>Ingen versjon er lagt ut ennå.</small>
          )}
        </div>
      </section>

      {latest?.notes.trim() && (
        <div className="card glow">
          <div className="label">Nytt i {latest.version}</div>
          <p className="notes" style={{ marginTop: 0 }}>{latest.notes}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, ['--i' as string]: 1 }}>
        <div className="label">Installere</div>
        <p className="notes" style={{ marginTop: 0 }}>
          Kjør GameHub-Setup.exe. Sier Windows «Windows beskyttet PC-en din»? Klikk <strong>Mer info</strong> → <strong>Kjør likevel</strong>.
          GameHub finner spillene dine av seg selv — ingen konto, ingen innlogging.
        </p>
      </div>

      {older.length > 0 && (
        <div className="card" style={{ marginTop: 16, ['--i' as string]: 2 }}>
          <div className="label">Eldre versjoner</div>
          {older.map((v) => (
            <div className="version-row" key={v.version}>
              <strong>GameHub {v.version}</strong>
              <span className="meta">{formatDate(v.uploadedAt)} · {formatBytes(v.size)}</span>
              <span className="spacer" />
              <a className="btn sm" href={v.url} download="GameHub-Setup.exe">Last ned</a>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
