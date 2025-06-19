import { NextRequest, NextResponse } from 'next/server';

import { selectSQL } from '../../../../_lib/mysql/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const resolvedParams = await params;
    const address = resolvedParams.address;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // 블로그 정보와 활성 테마 정보를 함께 조회
    const query = `
      SELECT 
        b.id,
        b.user_id,
        b.name,
        b.nickname,
        b.address,
        b.description,
        b.logo_image,
        b.created_at,
        b.updated_at,
        bt.theme_id,
        bt.theme_setting as theme_html,
        t.css as theme_css,
        t.html as original_theme_html,
        t.name as theme_name
      FROM blogs b
      LEFT JOIN blog_themes bt ON b.id = bt.blog_id AND bt.is_active = 1
      LEFT JOIN themes t ON bt.theme_id = t.id
      WHERE b.address = ?
      LIMIT 1
    `;

    const blogs = await selectSQL<any>(query, [address]);

    if (blogs.length === 0) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const blog = blogs[0];

    // 응답 데이터 구성 (Spring API와 동일한 구조)
    const response = {
      id: blog.id,
      user: { id: blog.user_id }, // Spring에서는 UsersEntity 객체로 반환하지만 여기서는 간단히
      name: blog.name,
      nickname: blog.nickname,
      address: blog.address,
      description: blog.description,
      logoImage: blog.logo_image,
      createdAt: blog.created_at,
      updatedAt: blog.updated_at,
      themeId: blog.theme_id,
      themeHtml: blog.theme_html, // 커스텀 HTML이 있으면 사용
      themeCss: blog.theme_css, // 테마의 원본 CSS
      originalThemeHtml: blog.original_theme_html, // 테마의 원본 HTML
      themeName: blog.theme_name,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
