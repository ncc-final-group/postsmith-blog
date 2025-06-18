import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../lib/constants';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, themeHtml, themeCss } = body;

    if (!blogId) {
      return NextResponse.json({ success: false, error: 'blogId is required' }, { status: 400 });
    }

    if (!themeHtml && !themeCss) {
      return NextResponse.json({ success: false, error: 'themeHtml or themeCss is required' }, { status: 400 });
    }

    // Spring API에 테마 콘텐츠 수정 요청
    const response = await fetch(`${API_BASE_URL}/api/manage/blog-themes/blog/${blogId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeHtml, themeCss }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      assert(false, 'Failed to update theme');
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: '테마가 성공적으로 업데이트되었습니다.',
      data: result,
    });
  } catch (error) {
    assert(false, 'Failed to update theme');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
