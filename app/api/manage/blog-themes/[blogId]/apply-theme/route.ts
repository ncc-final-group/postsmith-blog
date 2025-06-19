import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../../../lib/constants';

export async function POST(request: NextRequest, { params }: { params: Promise<{ blogId: string }> }) {
  try {
    const resolvedParams = await params;
    const blogId = resolvedParams.blogId;
    const body = await request.json();
    const { themeId } = body;

    if (!themeId) {
      return NextResponse.json({ error: 'themeId is required' }, { status: 400 });
    }

    // Spring API에 테마 적용 요청
    const response = await fetch(`${API_BASE_URL}/api/manage/blog-themes/blog/${blogId}/apply-theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId }),
    });

    if (!response.ok) {
      assert(false, 'Failed to apply theme');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
