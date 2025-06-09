import { NextRequest, NextResponse } from 'next/server';

import { getContentByBlogIdAndSequence } from '../../tbContents';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = parseInt(searchParams.get('blogId') || '1');
    const params = await context.params;
    const sequence = parseInt(params.id);

    if (isNaN(sequence)) {
      return NextResponse.json({
        success: false,
        message: '유효하지 않은 게시글 ID입니다.',
        data: null
      }, { status: 400 });
    }

    // 데이터베이스에서 콘텐츠 조회
    const result = await getContentByBlogIdAndSequence(blogId, sequence);
    
    if (!result || result.length === 0) {
      return NextResponse.json({
        success: false,
        message: '게시글을 찾을 수 없습니다.',
        data: null
      }, { status: 404 });
    }

    // 첫 번째 결과 반환 (content_sequence는 unique해야 함)
    const content = result[0];

    return NextResponse.json({
      success: true,
      data: content,
      message: 'Content fetched successfully'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      data: null
    }, { status: 500 });
  }
} 