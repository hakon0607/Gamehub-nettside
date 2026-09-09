import { configured, isLoggedIn } from '@/lib/auth';
import { currentVersion, listReleases, nextPatch, recentRuns, repo, type Release, type Run } from '@/lib/github';
import { AdminPanel } from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — GameHub' };

export default async function Admin({ searchParams }: { searchParams: Promise<{ feil?: string }> }) {
  const { feil } = await searchParams;

  if (!configured()) {
    return (
      <div className="login card">
        <h2>Admin er ikke satt opp ennå</h2>
        <p className="notes">
          Legg inn <code>ADMIN_PASSWORD</code> under <strong>Settings → Environment Variables</strong> i Vercel, og
          trykk <strong>Redeploy</strong>. Se <code>OPPSKRIFT-NETTSIDE.md</code>.
        </p>
      </div>
    );
  }

  if (!(await isLoggedIn())) {
    return (
      <form className="login card" method="post" action="/api/admin/login">
        <h2 style={{ marginBottom: 14 }}>Logg inn</h2>
        {feil === 'passord' && <div className="notice danger">Feil passord.</div>}
        <div className="field">
          <label htmlFor="password">Passord</label>
          <input id="password" name="password" type="password" autoFocus autoComplete="current-password" />
        </div>
        <button className="btn btn-accent" type="submit">
          Logg inn
        </button>
      </form>
    );
  }

  let releases: Release[] = [];
  let runs: Run[] = [];
  let version = '';
  let error: string | null = null;
  try {
    [releases, runs] = await Promise.all([listReleases(), recentRuns()]);
    version = await currentVersion();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <AdminPanel
      repo={repo()}
      hasToken={Boolean(process.env.GITHUB_TOKEN?.trim())}
      releases={releases}
      runs={runs}
      currentVersion={version}
      suggested={version ? nextPatch(version) : ''}
      error={error}
    />
  );
}
