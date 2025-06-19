import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { selectSQL } from '../../../../_lib/mysql/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const themeId = parseInt(resolvedParams.id);

    if (isNaN(themeId)) {
      return NextResponse.json({ error: 'Invalid theme ID' }, { status: 400 });
    }

    // 테마 정보 조회
    const query = `
      SELECT 
        id,
        name,
        cover_image,
        image,
        description,
        author,
        author_link,
        html,
        css
      FROM themes
      WHERE id = ?
      LIMIT 1
    `;

    const themes = await selectSQL<any>(query, [themeId]);

    if (themes.length === 0) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    const theme = themes[0];

    // 응답 데이터 구성 (Spring API의 ThemesDto와 동일한 구조)
    const response = {
      id: theme.id,
      name: theme.name,
      coverImage: theme.cover_image,
      image: theme.image,
      description: theme.description,
      author: theme.author,
      authorLink: theme.author_link,
      themeHtml: theme.html, // Spring에서는 html 필드를 themeHtml로 매핑
      themeCss: theme.css, // Spring에서는 css 필드를 themeCss로 매핑
      html: theme.html, // 원래 필드명도 유지
      css: theme.css, // 원래 필드명도 유지
    };

    return NextResponse.json(response);
  } catch (error) {
    assert(false, 'Failed to fetch theme');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
