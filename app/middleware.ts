import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || '';
  const url = req.nextUrl.clone();
  
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
  
  // subdomain이 없는 경우 패스
  if (!subdomain) {
    return NextResponse.next();
  }
  
  // 이미 user-blog 경로로 시작하는 경우 패스 (무한 리다이렉트 방지)
  if (url.pathname.startsWith('/user-blog/')) {
    return NextResponse.next();
  }

  // API 경로인 경우 요청 헤더에 subdomain 정보 추가하고 그대로 진행
  if (url.pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-subdomain', subdomain);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 서브도메인에 따라 rewrite
  url.pathname = `/user-blog/${subdomain}${url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
