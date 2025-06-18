import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../lib/constants';
import { extractBlogId } from '../../utils/blogUtils';

// 기본 테마 HTML
function getDefaultThemeHtml(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>PostSmith 블로그</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
        <header style="text-align: center; padding: 20px; border-bottom: 2px solid #eee;">
            <h1>PostSmith 블로그</h1>
            <p>Spring API 서버에 연결할 수 없습니다. 기본 테마로 표시됩니다.</p>
        </header>
        
        <main style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <h2>블로그 홈</h2>
            <p>현재 Spring API 서버와 연결할 수 없어 기본 테마로 표시되고 있습니다.</p>
            <p>Spring API 서버를 확인해 주세요.</p>
        </main>
        
        <footer style="text-align: center; padding: 20px; border-top: 1px solid #eee; margin-top: 40px;">
            <p>&copy; PostSmith · Powered by PostSmith</p>
        </footer>
    </body>
    </html>
  `;
}

// 기본 테마 CSS
function getDefaultThemeCss(): string {
  return `
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
    }
    
    header {
        background: #fff;
        margin-bottom: 20px;
    }
    
    main {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    h1, h2 {
        color: #2c3e50;
    }
    
    footer {
        color: #666;
        font-size: 0.9em;
        background: #fff;
    }
  `;
}

export async function GET(request: NextRequest) {
  // 블로그 ID 추출 (URL 파라미터 또는 호스트에서)
  let blogId = await extractBlogId(request);
  // URL 파라미터에서 blogId를 직접 지정한 경우
  const { searchParams } = new URL(request.url);
  const paramBlogId = searchParams.get('blogId');
  if (paramBlogId) {
    blogId = parseInt(paramBlogId);
  }

  try {
    if (!blogId) {
      return NextResponse.json({ error: '블로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Spring API에서 블로그의 현재 활성 테마 정보 가져오기
    const springApiUrl = `${API_BASE_URL}/api/manage/blog-themes/blog/${blogId}`;

    const response = await fetch(springApiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      assert(false, 'Failed to fetch theme content');
    }

    const blogTheme = await response.json();

    // BlogThemesDto에서 필요한 정보 추출
    return NextResponse.json({
      success: true,
      data: {
        blogId: blogTheme.blogId,
        blogName: blogTheme.blogName || 'Unknown Blog',
        themeHtml: blogTheme.themeHtml || '',
        themeCss: blogTheme.themeCss || '',
        themeName: blogTheme.themeName || 'Unknown Theme',
        themeId: blogTheme.themeId,
      },
    });
  } catch (error) {
    assert(false, 'Failed to fetch theme content');
    return NextResponse.json({
      success: true,
      data: {
        blogId: blogId || 2, // 요청된 blogId 또는 기본값
        blogName: 'PostSmith 블로그',
        themeHtml: getDefaultThemeHtml(),
        themeCss: getDefaultThemeCss(),
        themeName: 'Default Theme (Spring API 연결 실패)',
        themeId: null,
      },
    });
  }
}
