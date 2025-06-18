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
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store', // 항상 최신 데이터 가져오기
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * 블로그 주소로 테마 데이터 가져오기
 */
export async function getThemeByBlogAddress(address: string): Promise<ThemeData | null> {
  try {
    // 먼저 블로그 정보로 블로그 ID를 가져와야 함
    const blogResponse = await fetch(`${process.env.NEXT_PUBLIC_SPRING_API_URL}/api/blog/address/${address}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!blogResponse.ok) {
      return null;
    }

    const blog = await blogResponse.json();

    // 블로그 ID로 테마 데이터 가져오기
    return await getThemeByBlogId(blog.id);
  } catch (error) {
    return null;
  }
}
