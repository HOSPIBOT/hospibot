/**
 * HospiBot Portal Routing Middleware
 *
 * NOW   (Vercel preview / localhost):
 *   /clinical/login, /pharmacy/login, etc.  → portal path simulation
 *
 * FUTURE (hospibot.in connected to Vercel):
 *   clinical.hospibot.in/login → auto-detected by hostname
 *   pharmacy.hospibot.in/login → auto-detected by hostname
 *
 * Zero code change needed when hospibot.in goes live.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PORTAL_SLUGS = ['clinical', 'diagnostic', 'pharmacy', 'homecare', 'equipment', 'wellness', 'services'];
const ROOT_DOMAIN = 'hospibot.in';
const VERCEL_DOMAIN = 'hospibot-web.vercel.app'; // primary Vercel domain

function getPortalFromHostname(hostname: string): string | null {
  // e.g. clinical.hospibot.in → "clinical"
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const sub = hostname.replace(`.${ROOT_DOMAIN}`, '');
    if (PORTAL_SLUGS.includes(sub)) return sub;
  }
  // Local dev: clinical.localhost → "clinical"
  if (hostname.endsWith('.localhost')) {
    const sub = hostname.replace('.localhost', '');
    if (PORTAL_SLUGS.includes(sub)) return sub;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // ── Subdomain mode (hospibot.in subdomains are live) ─────────────────────
  const portalFromHost = getPortalFromHostname(hostname);

  if (portalFromHost) {
    // Rewrite: clinical.hospibot.in/login → /clinical/login internally
    const url = req.nextUrl.clone();
    url.pathname = `/${portalFromHost}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Path mode (Vercel preview / development) ──────────────────────────────
  // No rewrite needed — pages are served directly from /[portal]/...
  // Just ensure /register redirects work cleanly

  // Redirect bare /login to /auth/login (non-portal login)
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|hospibot-logo.png|api/).*)',
  ],
};
