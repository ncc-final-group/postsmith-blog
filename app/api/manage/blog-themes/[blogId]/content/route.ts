import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../../../lib/constants';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ blogId: string }> }) {
  try {
    const resolvedParams = await params;
    const blogId = resolvedParams.blogId;
    const body = await request.json();
    const { themeHtml, themeCss } = body;

    if (!themeHtml && !themeCss) {
      return NextResponse.json({ error: 'themeHtml or themeCss is required' }, { status: 400 });
    }

    // Spring API에 테마 콘텐츠 수정 요청
    const response = await fetch(`${API_BASE_URL}/api/manage/blog-themes/blog/${blogId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeHtml, themeCss }),
    });

    if (!response.ok) {
      assert(false, 'Failed to update theme content');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
