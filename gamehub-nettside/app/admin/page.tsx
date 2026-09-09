import { configured, isLoggedIn } from '@/lib/auth';
import { hasBlob, listVersions } from '@/lib/versions';
import { AdminPanel } from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };

export default async function Admin({ searchParams }: { searchParams: Promise<{ feil?: string }> }) {
  const { feil } = await searchParams;

  if (!configured()) {
    return (
      <div className="login card">
        <h2>Ikke satt opp ennå</h2>
        <p className="notes">Legg inn <code>ADMIN_PASSWORD</code> under Settings → Environment Variables i Vercel, og trykk Redeploy.</p>
      </div>
    );
  }
  if (!(await isLoggedIn())) {
    return (
      <form className="login card" method="post" action="/api/login">
        <h2 style={{ marginBottom: 14 }}>Logg inn</h2>
        {feil && <div className="notice danger">Feil passord.</div>}
        <div className="field">
          <label htmlFor="password">Passord</label>
          <input id="password" name="password" type="password" autoFocus />
        </div>
        <button className="btn btn-accent" type="submit">Logg inn</button>
      </form>
    );
  }

  const versions = await listVersions();
  const top = versions[0]?.version ?? '1.0.0';
  const [a, b, c] = top.split('.').map(Number);
  const suggested = versions.length ? `${a}.${b}.${(c ?? 0) + 1}` : '1.0.0';
  return <AdminPanel versions={versions} suggested={suggested} blobReady={hasBlob()} />;
}
