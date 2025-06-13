import { NextRequest, NextResponse } from 'next/server';

import { getContentByBlogIdAndSequence } from '../../tbContents';
import { extractBlogId } from '../../utils/blogUtils';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const blogId = await extractBlogId(request);

    // 블로그가 존재하지 않으면 404 반환
    if (blogId === null) {
      return NextResponse.json(
        {
          success: false,
          message: '블로그를 찾을 수 없습니다.',
          data: null,
        },
        { status: 404 },
      );
    }

    const params = await context.params;
    const sequence = parseInt(params.id);

    if (isNaN(sequence)) {
      return NextResponse.json(
        {
          success: false,
          message: '유효하지 않은 게시글 ID입니다.',
          data: null,
        },
        { status: 400 },
      );
    }

    // 데이터베이스에서 콘텐츠 조회
    const content = await getContentByBlogIdAndSequence(blogId, sequence);

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: '게시글을 찾을 수 없습니다.',
          data: null,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content fetched successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
      },
      { status: 500 },
    );
  }
}
