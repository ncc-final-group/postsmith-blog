import { NextRequest } from 'next/server';

/**
 * 요청에서 blogId를 추출합니다.
 * 1. URL 파라미터에서 blogId 확인
 * 2. 없으면 쿠키에서 블로그 정보 확인
 * 3. 없으면 x-subdomain 헤더 확인
 * 4. 그래도 없으면 호스트 헤더에서 subdomain 추출하여 API 호출
 * 5. 그래도 없으면 null 반환
 */
export async function extractBlogId(request: NextRequest): Promise<number | null> {
  try {
    const { searchParams } = new URL(request.url);
    let blogId = parseInt(searchParams.get('blogId') || '0');

    // URL 파라미터에 blogId가 있으면 그것을 사용
    if (blogId) {
      return blogId;
    }

    // 먼저 쿠키에서 블로그 정보 확인
    const blogInfoCookie = request.cookies.get('blog-info');
    if (blogInfoCookie) {
      try {
        const blogInfo = JSON.parse(blogInfoCookie.value);
        if (blogInfo && blogInfo.id) {
          return blogInfo.id;
        }
      } catch (error) {
        // 쿠키 파싱 실패 시 다음 단계로 진행
      }
    }

    // middleware에서 설정한 x-subdomain 헤더 확인
    let subdomain = request.headers.get('x-subdomain') || '';

    // x-subdomain 헤더가 없으면 hostname에서 subdomain 추출하여 API 호출
    if (!subdomain) {
      const hostname = request.headers.get('host') || request.headers.get('authority') || '';

      if (hostname.includes('.postsmith.kro.kr')) {
        subdomain = hostname.split('.postsmith.kro.kr')[0];
      } else if (hostname.includes('.')) {
        const parts = hostname.split('.');
        // localhost 환경에서는 첫 번째 부분이 address가 됨 (address.localhost)
        if (parts.length > 1 && parts[0] !== 'localhost') {
          subdomain = parts[0];
        }
      }
    }

    if (subdomain) {
      try {
        // API를 통해 블로그 정보 조회
        const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
        const response = await fetch(`${baseUrl}/api/blog?address=${subdomain}`);

        if (response.ok) {
          const blog = await response.json();
          if (blog && blog.id) {
            return blog.id;
          }
        }
      } catch (error) {
        // API 호출 실패
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}
