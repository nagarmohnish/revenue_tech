import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { walletSummary } from '@/lib/billing';
import { supabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  try {
    const summary = await walletSummary(s.workspaceId);
    return NextResponse.json(summary);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'wallet failed' }, { status: 500 });
  }
}
