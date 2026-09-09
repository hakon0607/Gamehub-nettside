import type { Release } from '@/lib/github';
import { render } from '@/lib/markdown';
import { formatBytes, formatDate } from '@/lib/format';

export function ReleaseCard({ release, latest, index = 0 }: { release: Release; latest?: boolean; index?: number }) {
  return (
    <div className={`card${latest ? ' glow' : ''}`} style={{ ['--i' as string]: index }}>
      <div className="release">
        <div>
          <h2>
            GameHub {release.version}{' '}
            {latest && <span className="pill ok">Nyeste</span>}
            {release.prerelease && <span className="pill warn">Skjult</span>}
          </h2>
          <p className="meta">
            {formatDate(release.publishedAt)}
            {release.installer ? ` · ${formatBytes(release.installer.size)} · lastet ned ${release.installer.downloads} ganger` : ' · ingen installer i denne'}
          </p>
          {release.body.trim() ? (
            <div className="notes" dangerouslySetInnerHTML={{ __html: render(release.body) }} />
          ) : (
            <p className="notes">Ingen notater for denne versjonen.</p>
          )}
        </div>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {release.installer && (
            <a className={`btn${latest ? ' btn-accent' : ''}`} href={release.installer.downloadUrl}>
              ⬇ Last ned {release.version}
            </a>
          )}
          <a className="btn btn-ghost sm" href={release.url} target="_blank" rel="noopener">
            Se på GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
