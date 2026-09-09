import Link from 'next/link';
import { listReleases, pickLatest } from '@/lib/github';
import { formatBytes, formatDate } from '@/lib/format';
import { ReleaseCard } from '@/components/ReleaseCard';

export const revalidate = 60;

const FEATURES = [
  ['▦', 'Alle spillene på ett sted', 'Steam, Epic, Xbox, EA, Ubisoft Connect, Battle.net, GOG og Riot — funnet automatisk, også det du installerer senere.'],
  ['⏺', 'Replay med lyd', 'Skjermen tas opp fortløpende i opptil 10 minutter. Trykk F8, så er de siste sekundene lagret som et klipp — med spillyden.'],
  ['❄', 'Frys spillet', 'Midt i en cutscene der spillet ikke lar deg lagre? F7 stopper spillet der det står, og tar kopi av lagringen.'],
  ['◆', 'Quests og streaks', 'Daglige og månedlige oppdrag laget av spillene du eier. Streaks og kalender følger spillingen din av seg selv.'],
  ['⎙', 'Screenshots og ytelse', 'F9 tar bilde som havner under riktig spill. Ytelsessiden viser CPU, minne og disk mens du spiller.'],
  ['↑', 'Oppdaterer seg selv', 'Ny versjon? Appen sier fra, og du oppdaterer med ett klikk. Biblioteket ditt rører den aldri.'],
];

export default async function Home() {
  let error: string | null = null;
  let releases: Awaited<ReturnType<typeof listReleases>> = [];
  try {
    releases = await listReleases();
  } catch (e) {
    error = String(e instanceof Error ? e.message : e);
  }
  const latest = pickLatest(releases);

  return (
    <>
      <section className="hero">
        <h1>Alle spillene dine.<br />Ett bibliotek.</h1>
        <p>
          GameHub samler spillene fra alle launcherne dine, tar opp de beste øyeblikkene med lyd, og lar deg fryse et
          spill midt i en cutscene. Gratis for Windows.
        </p>
        <div className="cta">
          {latest?.installer ? (
            <>
              <a className="btn big btn-accent" href={latest.installer.downloadUrl}>
                ⬇ Last ned GameHub {latest.version}
              </a>
              <small>
                Windows 10/11 · {formatBytes(latest.installer.size)} · {formatDate(latest.publishedAt)} ·{' '}
                <Link href="/versjoner">alle versjoner</Link>
              </small>
            </>
          ) : (
            <small>{error ?? 'Ingen versjon er publisert ennå. Kom tilbake snart.'}</small>
          )}
        </div>
      </section>

      <div className="features">
        {FEATURES.map(([icon, title, text], i) => (
          <div className="card feature" key={title} style={{ ['--i' as string]: i }}>
            <div className="icon">{icon}</div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>

      {latest && (
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '20px 0 12px' }}>Nytt i {latest.version}</h2>
          <ReleaseCard release={latest} latest />
        </section>
      )}

      <section className="card" style={{ marginTop: 24 }}>
        <h3>Installere</h3>
        <div className="steps" style={{ margin: '8px 0 0' }}>
          <div className="step"><span>Last ned <strong>GameHub-Setup.exe</strong> med knappen øverst.</span></div>
          <div className="step"><span>Kjør filen. Sier Windows «Windows beskyttet PC-en din»? Klikk <strong>Mer info</strong> → <strong>Kjør likevel</strong>. Installeren er ikke kodesignert, men oppdateringene er.</span></div>
          <div className="step"><span>GameHub finner spillene dine av seg selv. Ingen konto, ingen innlogging.</span></div>
        </div>
      </section>
    </>
  );
}
