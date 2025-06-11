import { NextRequest } from 'next/server';
import { getBlogByAddress } from '../tbBlogs';

/**
 * 요청에서 blogId를 추출합니다.
 * 1. URL 파라미터에서 blogId 확인
 * 2. 없으면 호스트 헤더에서 subdomain 추출하여 해당 블로그 ID 조회
 * 3. subdomain이 있는데 해당 블로그가 없으면 null 반환 (404 처리를 위해)
 * 4. subdomain이 없으면 null 반환 (메인 도메인에서는 블로그 비활성화)
 */
export async function extractBlogId(request: NextRequest): Promise<number | null> {
  try {
    const { searchParams } = new URL(request.url);
    let blogId = parseInt(searchParams.get('blogId') || '0');
    
    // URL 파라미터에 blogId가 있으면 그것을 사용
    if (blogId) {
      return blogId;
    }
    
    // 먼저 미들웨어에서 설정한 x-subdomain 헤더 확인
    let subdomain = request.headers.get('x-subdomain') || '';
    
    // x-subdomain 헤더가 없으면 hostname에서 추출
    if (!subdomain) {
      const hostname = request.headers.get('host') || '';
      
      if (hostname.includes('localhost')) {
        // localhost 환경에서 subdomain 확인
        // 예: 주소.localhost:3000 -> subdomain = '주소'
        const parts = hostname.split('.');
        if (parts.length > 1 && !parts[0].startsWith('localhost')) {
          subdomain = parts[0];
        }
      } else if (hostname.includes('.')) {
        // 일반 도메인에서 subdomain 확인
        // 예: 주소.yourdomain.com -> subdomain = '주소'
        const parts = hostname.split('.');
        if (parts.length > 2) { // www.yourdomain.com이 아닌 경우
          subdomain = parts[0];
        }
      }
    }
    
    if (subdomain) {
      const blog = await getBlogByAddress(subdomain);
      
      if (blog) {
        return blog.id;
      } else {
        // subdomain은 있지만 해당 블로그가 존재하지 않음
        return null;
      }
    }
    
    // subdomain이 없는 경우 (메인 도메인) - 404 처리
    return null;
  } catch (error) {
    return null;
  }
} 