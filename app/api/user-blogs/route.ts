import { NextRequest, NextResponse } from 'next/server';

import { getBlogsByUserId } from '../tbBlogs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId 파라미터가 필요합니다.' }, { status: 400 });
  }

  try {
    const blogs = await getBlogsByUserId(parseInt(userId));
    return NextResponse.json(blogs);
  } catch (error) {
    return NextResponse.json({ error: '블로그 리스트 조회에 실패했습니다.' }, { status: 500 });
  }
}
