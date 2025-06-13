import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';

  // 서브도메인 추출 로직
  let subdomain = '';

  if (hostname.includes('localhost')) {
    // localhost 환경에서 subdomain 확인 (예: 주소.localhost:3000)
    const parts = hostname.split('.');
    if (parts.length > 1 && !parts[0].startsWith('localhost')) {
      subdomain = parts[0];
    }
  } else if (hostname.includes('.')) {
    // 실제 도메인에서 subdomain 확인 (예: 주소.yourdomain.com)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // 서브도메인이 있는 경우 헤더에 정보 추가
  if (subdomain) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-subdomain', subdomain);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
