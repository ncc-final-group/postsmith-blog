import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../../../lib/constants';
import { extractBlogId } from '../../utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    // 블로그 ID 추출 (URL 파라미터 또는 호스트에서)
    let blogId = await extractBlogId(request);
    
    // URL 파라미터에서 blogId를 직접 지정한 경우
    const { searchParams } = new URL(request.url);
    const paramBlogId = searchParams.get('blogId');
    if (paramBlogId) {
      blogId = parseInt(paramBlogId);
    }

    if (!blogId) {
      return NextResponse.json({ error: '블로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Spring API에서 블로그 정보 가져오기
    const response = await fetch(`${API_BASE_URL}/api/blog/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`블로그 정보 조회 실패: ${response.status}`);
    }

    const blog = await response.json();
    
    let themeHtml = '';
    let themeCss = '';
    let themeName = 'Unknown';

    // 1. 우선순위: 블로그에 저장된 커스텀 HTML/CSS 확인
    if (blog.themeHtml && blog.themeCss) {
      themeHtml = blog.themeHtml;
      themeCss = blog.themeCss;
      themeName = 'Custom Theme';
      console.log(`블로그 ${blogId}: 커스텀 테마 사용`);
    }
    // 2. 커스텀 테마가 없으면 테마 원본 데이터 가져오기
    else if (blog.themeId) {
      try {
        const themeResponse = await fetch(`${API_BASE_URL}/api/manage/themes/${blog.themeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (themeResponse.ok) {
          const themeData = await themeResponse.json();
          themeHtml = themeData.themeHtml || '';
          themeCss = themeData.themeCss || '';
          themeName = themeData.name || 'Unknown';
          console.log(`블로그 ${blogId}: 기본 테마(${themeName}) 사용`);
        } else {
          console.warn(`블로그 ${blogId}: 테마 ID ${blog.themeId} 조회 실패`);
        }
      } catch (themeError) {
        console.error('테마 원본 데이터 조회 오류:', themeError);
      }
    }
    
    // 3. HTML이나 CSS 중 하나만 있는 경우 (부분 커스터마이징)
    if (blog.themeHtml && !blog.themeCss && blog.themeId) {
      try {
        const themeResponse = await fetch(`${API_BASE_URL}/api/manage/themes/${blog.themeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (themeResponse.ok) {
          const themeData = await themeResponse.json();
          themeHtml = blog.themeHtml;
          themeCss = themeData.themeCss || '';
          themeName = `${themeData.name || 'Unknown'} (Custom HTML)`;
          console.log(`블로그 ${blogId}: HTML만 커스텀, CSS는 기본 테마 사용`);
        }
      } catch (error) {
        console.error('부분 커스터마이징 처리 오류:', error);
      }
    } else if (!blog.themeHtml && blog.themeCss && blog.themeId) {
      try {
        const themeResponse = await fetch(`${API_BASE_URL}/api/manage/themes/${blog.themeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (themeResponse.ok) {
          const themeData = await themeResponse.json();
          themeHtml = themeData.themeHtml || '';
          themeCss = blog.themeCss;
          themeName = `${themeData.name || 'Unknown'} (Custom CSS)`;
          console.log(`블로그 ${blogId}: CSS만 커스텀, HTML은 기본 테마 사용`);
        }
      } catch (error) {
        console.error('부분 커스터마이징 처리 오류:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        blogId: blog.id,
        blogName: blog.name,
        themeHtml: themeHtml || '',
        themeCss: themeCss || '',
        themeName: themeName,
        themeId: blog.themeId
      }
    });

  } catch (error) {
    console.error('테마 컨텐츠 조회 오류:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: '테마 컨텐츠 조회 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 