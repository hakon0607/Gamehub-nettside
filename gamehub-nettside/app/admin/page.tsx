import { isAdmin, password } from '@/lib/admin';
import { configured } from '@/lib/db';
import { stats, type Stats } from '@/lib/stats';
import { releases } from '@/lib/releases';
import { Dashboard } from './Dashboard';
import { Login } from './Login';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GameHub — admin', robots: { index: false, follow: false } };

export default async function Admin() {
  if (!password()) {
    return (
      <div className="card glow" style={{ marginTop: 24 }}>
        <div className="label">Admin</div>
        <p className="notes" style={{ marginTop: 0 }}>
          Set <code>ADMIN_PASSWORD</code> under Settings → Environment Variables in Vercel, redeploy, and this page becomes the statistics dashboard.
        </p>
      </div>
    );
  }
  if (!(await isAdmin())) return <Login />;
  if (!configured) {
    return (
      <div className="card glow" style={{ marginTop: 24 }}>
        <div className="label">No database yet</div>
        <p className="notes" style={{ marginTop: 0 }}>
          In Vercel: Storage → Create Database → Neon (Postgres) → connect it to this project. Vercel sets <code>DATABASE_URL</code> by itself. Redeploy, and the numbers start arriving as soon as someone runs GameHub 1.9 or newer.
        </p>
      </div>
    );
  }

  let initial: Stats | null = null;
  let problem = '';
  try {
    initial = await stats();
  } catch (error) {
    problem = String(error);
  }
  const { totalDownloads, all } = await releases();
  return <Dashboard initial={initial} problem={problem} downloads={totalDownloads} versionsPublished={all.length} />;
}
