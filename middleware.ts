import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get('host') || req.headers.get('authority') || req.headers.get(':authority') || '';
  const url = req.nextUrl;
  const requestHeaders = new Headers(req.headers);

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('CLIENT_SESSION_ID');

  if (url.pathname.startsWith('/usermanage')) {
    if (!sessionId) {
      return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/login`, req.url));
    }
  }

  // 서브도메인 추출 로직
  let subdomain = '';

  if (hostname.includes('.postsmith.kro.kr')) {
    subdomain = hostname.split('.postsmith.kro.kr')[0];
  } else if (hostname.includes('.')) {
    const parts = hostname.split('.');
    // localhost 환경에서는 첫 번째 부분이 address가 됨 (address.localhost)
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  }

  // subdomain이 있으면 헤더에 설정
  if (subdomain) {
    requestHeaders.set('x-subdomain', subdomain);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // 서브도메인이 있는 경우 블로그 정보 조회 후 쿠키에 설정
  if (subdomain) {
    try {
      // 내부 API 호출을 위한 URL 생성
      const apiUrl = `${url.protocol}//${url.host}/api/blog?address=${subdomain}`;
      const blogResponse = await fetch(apiUrl);

      if (blogResponse.ok) {
        const blog = await blogResponse.json();
        if (blog && blog.id) {
          const blogInfo = {
            id: blog.id,
            nickname: blog.nickname,
            description: blog.description,
            logo_image: blog.logo_image,
            address: blog.address,
          };

          // 블로그 정보를 쿠키에 저장
          response.cookies.set('blog-info', JSON.stringify(blogInfo), {
            path: '/',
            maxAge: 60 * 60 * 24, // 24시간
            httpOnly: false, // 클라이언트에서 접근 가능하도록 설정
          });
        } else {
          // 블로그를 찾을 수 없는 경우 쿠키 삭제
          response.cookies.delete('blog-info');
        }
      } else {
        // API 응답이 실패한 경우 쿠키 삭제
        response.cookies.delete('blog-info');
      }
    } catch (error) {
      // 블로그 조회 실패 시 무시
      response.cookies.delete('blog-info');
    }
  } else {
    // subdomain이 없는 경우 쿠키 삭제
    response.cookies.delete('blog-info');
  }

  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
