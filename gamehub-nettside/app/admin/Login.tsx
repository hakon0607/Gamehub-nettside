'use client';
import { useState } from 'react';

export function Login() {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) });
    if (res.ok) {
      window.location.reload();
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.reason || 'Could not log in');
    setBusy(false);
  }

  return (
    <form className="card glow login" onSubmit={submit}>
      <div className="label">Admin</div>
      <div className="field">
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <span className="hint" style={{ color: 'var(--danger)' }}>{error}</span>}
      </div>
      <button className={`btn btn-accent${busy ? ' busy' : ''}`} disabled={busy || !password}>Open the dashboard</button>
    </form>
  );
}
