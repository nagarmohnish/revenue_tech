'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Lock, Shield } from 'lucide-react';

interface Row {
  id: string;
  name: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  balance: number;
  lastActive: string | null;
  owner: { email: string; name: string } | null;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('admin_secret') : null;
    if (saved) {
      setSecret(saved);
      load(saved);
    }
  }, []);

  async function load(s = secret) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/workspaces', { headers: { 'x-admin-secret': s } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Forbidden');
      sessionStorage.setItem('admin_secret', s);
      setRows(data.workspaces);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell admin>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-400 uppercase tracking-wider">Internal</div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900 flex items-center gap-2"><Shield size={20} /> Admin</h1>
          <p className="text-sm text-ink-500 mt-1">All workspaces · balance · plan · last active.</p>
        </div>
      </div>

      {!rows && (
        <div className="mt-6 card p-5 max-w-md">
          <label className="block text-xs font-medium text-ink-500 mb-1.5 flex items-center gap-1"><Lock size={12} /> ADMIN_SECRET_KEY</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Set this in .env.local"
              className="field"
            />
            <button disabled={!secret || loading} onClick={() => load()} className="btn-primary">
              {loading ? 'Loading…' : 'Unlock'}
            </button>
          </div>
          {error && <div className="mt-3 text-sm text-bad">{error}</div>}
        </div>
      )}

      {rows && (
        <section className="mt-6 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Workspace</th>
                <th className="text-left px-4 py-2.5 font-medium">Owner</th>
                <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                <th className="text-right px-4 py-2.5 font-medium">Balance</th>
                <th className="text-left px-4 py-2.5 font-medium">Last active</th>
                <th className="text-left px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-ink-100">
                  <td className="px-4 py-2.5 text-ink-900 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-ink-500">{r.owner?.email || '-'}</td>
                  <td className="px-4 py-2.5"><span className="tag tag-muted capitalize">{r.plan}</span></td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.balance.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-ink-500">{r.lastActive ? new Date(r.lastActive).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2.5 text-ink-500">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-500">No workspaces yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </AppShell>
  );
}
