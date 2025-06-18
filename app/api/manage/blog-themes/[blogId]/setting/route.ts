import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../../../lib/constants';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ blogId: string }> }) {
  try {
    const resolvedParams = await params;
    const blogId = resolvedParams.blogId;
    const body = await request.json();
    const { themeSetting } = body;

    if (!themeSetting) {
      return NextResponse.json({ error: 'themeSetting is required' }, { status: 400 });
    }

    // Spring API에 테마 설정 수정 요청
    const response = await fetch(`${API_BASE_URL}/api/manage/blog-themes/blog/${blogId}/setting`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeSetting }),
    });

    if (!response.ok) {
      assert(false, 'Failed to update theme setting');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
