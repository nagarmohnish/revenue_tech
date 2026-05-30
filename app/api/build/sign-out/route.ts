import { NextResponse } from 'next/server';
import { clearBuilderSessionCookie } from '@/lib/builderAuth';

export async function POST() {
  await clearBuilderSessionCookie();
  return NextResponse.json({ ok: true });
}
