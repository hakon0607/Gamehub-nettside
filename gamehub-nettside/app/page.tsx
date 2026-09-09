import { latestRelease } from '@/lib/releases';
import { formatBytes, formatDate } from '@/lib/format';

export const revalidate = 120;

export default async function Home() {
  const latest = await latestRelease();

  return (
    <>
      <section className="hero">
        <h1>Alle spillene dine.<br />Ett bibliotek.</h1>
        <p>Steam, Epic, Xbox, EA, Ubisoft, Battle.net, GOG og Riot på ett sted. Replay med lyd. Frys spillet midt i en cutscene.</p>
        <div className="cta">
          {latest ? (
            <>
              <a className="btn big btn-accent" href={latest.url}>⬇ Last ned GameHub {latest.version}</a>
              <small>Windows 10/11 · {formatBytes(latest.size)} · {formatDate(latest.publishedAt)}</small>
            </>
          ) : (
            <small>Ingen versjon er lagt ut ennå.</small>
          )}
        </div>
      </section>

      {latest?.notes && (
        <div className="card glow">
          <div className="label">Nytt i {latest.version}</div>
          <p className="notes" style={{ marginTop: 0 }}>{latest.notes}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, ['--i' as string]: 1 }}>
        <div className="label">Installere</div>
        <p className="notes" style={{ marginTop: 0 }}>
          Kjør GameHub-Setup.exe. Sier Windows «Windows beskyttet PC-en din»? Klikk <strong>Mer info</strong> → <strong>Kjør likevel</strong>.
          GameHub finner spillene dine av seg selv — ingen konto, ingen innlogging. Appen oppdaterer seg selv når det kommer en ny versjon.
        </p>
      </div>
    </>
  );
}
