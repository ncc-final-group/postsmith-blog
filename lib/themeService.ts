export interface ThemeData {
  blogId: number;
  blogName: string;
  themeHtml: string;
  themeCss: string;
  themeName: string;
  themeId?: number;
}

/**
 * 블로그 ID로 테마 데이터 가져오기
 * 우선순위: 블로그 커스텀 테마 → 기본 테마
 */
export async function getThemeByBlogId(blogId: number): Promise<ThemeData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blog/theme-content?blogId=${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 항상 최신 데이터 가져오기
    });

    if (!response.ok) {
      console.error(`테마 데이터 조회 실패: ${response.status}`);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error('테마 데이터 조회 결과 오류:', result.error);
      return null;
    }
  } catch (error) {
    console.error('테마 데이터 조회 중 오류:', error);
    return null;
  }
}

/**
 * 블로그 주소로 테마 데이터 가져오기
 */
export async function getThemeByBlogAddress(address: string): Promise<ThemeData | null> {
  try {
    // 먼저 블로그 정보로 블로그 ID를 가져와야 함
    const blogResponse = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_URL || 'http://localhost:8080'}/api/blog/address/${address}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!blogResponse.ok) {
      console.error(`블로그 조회 실패: ${blogResponse.status}`);
      return null;
    }

    const blog = await blogResponse.json();
    
    // 블로그 ID로 테마 데이터 가져오기
    return await getThemeByBlogId(blog.id);
  } catch (error) {
    console.error('블로그 주소로 테마 조회 중 오류:', error);
    return null;
  }
} 