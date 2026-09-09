import { listReleases, pickLatest } from '@/lib/github';
import { ReleaseCard } from '@/components/ReleaseCard';

export const revalidate = 60;

export const metadata = { title: 'Versjoner — GameHub' };

export default async function Versions() {
  let releases: Awaited<ReturnType<typeof listReleases>> = [];
  let error: string | null = null;
  try {
    releases = (await listReleases()).filter((r) => !r.prerelease);
  } catch (e) {
    error = String(e instanceof Error ? e.message : e);
  }
  const latest = pickLatest(releases);

  return (
    <>
      <section className="hero" style={{ padding: '30px 0 24px' }}>
        <h1 style={{ fontSize: 40 }}>Versjoner</h1>
        <p>Hver versjon, nyeste først. Appen oppdaterer seg selv, så du trenger normalt bare den øverste.</p>
      </section>
      {error && <div className="notice danger">{error}</div>}
      {releases.length === 0 ? (
        <p className="empty">Ingen versjoner ennå.</p>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {releases.map((release, i) => (
            <ReleaseCard key={release.id} release={release} latest={release.id === latest?.id} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
