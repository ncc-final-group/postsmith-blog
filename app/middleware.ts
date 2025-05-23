import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const currentHost = hostname.split('.')[0]; // e.g. username.example.com → "username"

  const url = req.nextUrl.clone();

  // 서브도메인에 따라 rewrite
  url.pathname = `/user-blog/${currentHost}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
