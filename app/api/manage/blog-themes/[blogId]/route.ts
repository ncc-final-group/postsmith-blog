import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../../lib/constants';

export async function GET(request: NextRequest, { params }: { params: Promise<{ blogId: string }> }) {
  try {
    const resolvedParams = await params;
    const blogId = resolvedParams.blogId;

    // Spring API에서 블로그의 현재 테마 조회
    const response = await fetch(`${API_BASE_URL}/api/manage/blog-themes/blog/${blogId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'No active theme found' }, { status: 404 });
      }
      assert(false, 'Failed to fetch blog theme');
    }

    const blogTheme = await response.json();
    return NextResponse.json(blogTheme);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
