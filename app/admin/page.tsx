'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import {
  Button, Card, EmptyState, PageHeader, Eyebrow, Badge, Field, Input, InfoBanner, Stat,
} from '@/components/ui';
import { Lock, Shield, Users } from 'lucide-react';

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
    setLoading(true); setError(null);
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

  const totalBalance = rows?.reduce((acc, r) => acc + r.balance, 0) ?? 0;
  const activeCount = rows?.filter((r) => r.lastActive && Date.now() - new Date(r.lastActive).getTime() < 7 * 24 * 60 * 60 * 1000).length ?? 0;

  return (
    <AppShell admin>
      <PageHeader
        eyebrow={<Eyebrow icon={<Shield size={11} />}>Internal</Eyebrow>}
        title="Admin"
        description="Every workspace · plan · balance · last active. Read-only."
      />

      {!rows ? (
        <Card padding="lg" className="mt-8 max-w-md">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-ink-950 text-brand-400 flex items-center justify-center">
              <Lock size={18} />
            </span>
            <div>
              <h2 className="font-extrabold text-ink-950 tracking-tight">Locked</h2>
              <p className="text-[12.5px] text-ink-500">Enter <code className="mono">ADMIN_SECRET_KEY</code> to view workspaces.</p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (secret) load(); }}
            className="mt-5 space-y-3"
          >
            <Field label="Secret">
              <Input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="set in .env.local" />
            </Field>
            <Button type="submit" disabled={!secret} loading={loading} fullWidth>
              {loading ? 'Loading…' : 'Unlock'}
            </Button>
            {error && <InfoBanner tone="error">{error}</InfoBanner>}
          </form>
        </Card>
      ) : (
        <>
          <section className="mt-8 grid sm:grid-cols-3 gap-3">
            <Stat label="Workspaces" value={rows.length} icon={<Users size={16} />} />
            <Stat label="Active this week" value={activeCount} hint={rows.length ? `${Math.round((activeCount / rows.length) * 100)}% of total` : undefined} />
            <Stat label="Credits in circulation" value={totalBalance.toLocaleString()} hint="across all wallets" />
          </section>

          <Card padding="none" className="mt-6 overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-12">
                <EmptyState
                  icon={<Users size={24} />}
                  title="No workspaces yet"
                  body="Customers who sign up at /login will show up here."
                />
              </div>
            ) : (
              <table className="w-full text-[13.5px]">
                <thead className="bg-ink-50">
                  <tr className="text-[10.5px] uppercase tracking-[.12em] text-ink-500 font-bold">
                    <th className="text-left px-4 py-3">Workspace</th>
                    <th className="text-left px-4 py-3">Owner</th>
                    <th className="text-left px-4 py-3">Plan</th>
                    <th className="text-right px-4 py-3">Balance</th>
                    <th className="text-left px-4 py-3">Last active</th>
                    <th className="text-left px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-ink-100 hover:bg-ink-50/40">
                      <td className="px-4 py-3 text-ink-950 font-bold">{r.name}</td>
                      <td className="px-4 py-3 text-ink-500 mono text-[12.5px]">{r.owner?.email || '—'}</td>
                      <td className="px-4 py-3"><Badge tone="neutral" className="capitalize">{r.plan}</Badge></td>
                      <td className="px-4 py-3 text-right font-mono tnum font-bold text-ink-950">{r.balance.toLocaleString()}</td>
                      <td className="px-4 py-3 text-ink-500 mono text-[12px]">{r.lastActive ? new Date(r.lastActive).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-ink-500 mono text-[12px]">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </AppShell>
  );
}
