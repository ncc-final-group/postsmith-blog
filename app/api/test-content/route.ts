import { NextRequest, NextResponse } from 'next/server';

import { getContentByBlogIdAndSequence, getContentsByBlogId } from '../tbContents';

export async function GET(request: NextRequest) {
  try {
    const blogId = 1; // 테스트용 블로그 ID (실제로는 동적으로 설정)

    // 해당 블로그의 모든 컨텐츠 조회
    const allContents = await getContentsByBlogId(blogId);

    // sequence=3인 컨텐츠 조회
    const targetContent = await getContentByBlogIdAndSequence(blogId, 3);

    return NextResponse.json({
      success: true,
      data: {
        blogId,
        allContents,
        targetContent,
        totalContents: allContents.length,
        sequences: allContents.map((c) => c.sequence),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
