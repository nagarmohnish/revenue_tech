import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { recentUsage } from '@/lib/billing';
import { supabaseConfigured } from '@/lib/supabase';

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  const s = await getSession();
  if (!s) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  const events = await recentUsage(s.workspaceId, 30);
  return NextResponse.json({ events });
}
