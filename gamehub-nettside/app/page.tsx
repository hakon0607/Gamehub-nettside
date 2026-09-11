import { releases } from '@/lib/releases';
import { formatBytes, formatCount, formatDate } from '@/lib/format';

export const revalidate = 120;

const FEATURES: [string, string, string][] = [
  ['▦', 'One library', 'Steam, Epic, Xbox, EA, Ubisoft, Battle.net, GOG and Riot — found automatically, covers included.'],
  ['⏺', 'Instant replay', 'The last 30 seconds to 10 minutes are always kept. Press F8 and the clip is saved — with game audio.'],
  ['❄', 'Freeze the game', 'F7 pauses any game where it stands, mid-cutscene, and copies your save. Press again to continue.'],
  ['⎙', 'Popup over the game', 'A small card with a pling tells you a screenshot, clip or freeze worked — without leaving the game.'],
  ['🖼', 'Wallpapers', 'Set the desktop background and the lock screen picture from inside GameHub.'],
  ['◆', 'Quests and streaks', 'Progress that follows how you actually play. Playtime counts only while you are really playing.'],
  ['⌕', 'Search everything', 'Ctrl+K finds games, pages, settings and actions from anywhere.'],
  ['🌍', '10 languages', 'English, Norwegian, Swedish, Danish, Finnish, German, French, Spanish, Polish, Dutch.'],
];

export default async function Home() {
  const { latest, all, totalDownloads } = await releases();

  return (
    <>
      <section className="hero">
        <img src="/logo.svg" alt="" width={96} height={96} className="hero-logo" />
        <h1>Every PC game.<br />One place.</h1>
        <p>A free Windows app that puts all your games in one library — with instant replay, a freeze button, and popups that work over the game.</p>
        <div className="cta">
          {latest ? (
            <>
              <a className="btn big btn-accent" href={latest.url} rel="nofollow">⬇ Download GameHub {latest.version}</a>
              <small>Windows 10/11 · {formatBytes(latest.size)} · {formatDate(latest.publishedAt)}</small>
              <div className="counter" title="Counted by GitHub every time the installer is downloaded">
                <strong>{formatCount(totalDownloads)}</strong> {totalDownloads === 1 ? 'download' : 'downloads'} so far
              </div>
            </>
          ) : (
            <small>No version has been published yet.</small>
          )}
        </div>
      </section>

      <div className="features">
        {FEATURES.map(([icon, title, text], i) => (
          <div key={title} className="card feature" style={{ ['--i' as string]: i }}>
            <div className="feature-icon" aria-hidden="true">{icon}</div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        ))}
      </div>

      {latest?.notes && (
        <div className="card glow" style={{ marginTop: 16 }}>
          <div className="label">New in {latest.version}</div>
          <p className="notes" style={{ marginTop: 0 }}>{latest.notes}</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 16, ['--i' as string]: 1 }}>
        <div className="label">Install</div>
        <p className="notes" style={{ marginTop: 0 }}>
          Run GameHub-Setup.exe. If Windows says “Windows protected your PC”, click <strong>More info</strong> → <strong>Run anyway</strong>.
          GameHub finds your games by itself — no account, no sign-in. The app updates itself when a new version is out.
        </p>
      </div>

      {all.length > 0 && (
        <div className="card" style={{ marginTop: 16, ['--i' as string]: 2 }}>
          <div className="label">All versions</div>
          {all.map((r) => (
            <div key={r.version} className="version-row">
              <strong>{r.version}</strong>
              <span className="meta">{formatDate(r.publishedAt)}</span>
              <span className="meta">{formatCount(r.downloads)} {r.downloads === 1 ? 'download' : 'downloads'}</span>
              <span className="spacer" />
              <a className="btn" href={r.url} rel="nofollow">Download</a>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
