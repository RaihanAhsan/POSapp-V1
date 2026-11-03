import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get('auth_token')?.value;
  const authRole = request.cookies.get('auth_role')?.value;

  // 1. If accessing login while already authenticated, redirect
  if (pathname === '/login') {
    if (authToken && authRole) {
      if (authRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    return NextResponse.next();
  }

  // 2. Admin routes protection
  if (pathname.startsWith('/admin')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Strict RBAC: Staff cannot access Admin routes!
    if (authRole !== 'admin') {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    return NextResponse.next();
  }

  // 3. POS route protection
  if (pathname.startsWith('/pos')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/pos/:path*', '/login'],
};
