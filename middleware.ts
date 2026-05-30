import { NextRequest, NextResponse } from 'next/server';

const CUSTOMER_PROTECTED = ['/dashboard', '/agents', '/billing', '/admin'];
const BUILDER_PROTECTED = ['/build'];
const BUILDER_PUBLIC = ['/build/signup', '/build/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Builder-side guard ──────────────────────────────────────
  if (BUILDER_PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    if (BUILDER_PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.next();
    }
    const cookie = req.cookies.get('agentmint_builder_session');
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/build/signup';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Customer-side guard (hosted workspace UI) ───────────────
  if (CUSTOMER_PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    const cookie = req.cookies.get('agentmint_session');
    if (!cookie) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/agents/:path*', '/billing/:path*', '/admin/:path*', '/build/:path*'],
};
