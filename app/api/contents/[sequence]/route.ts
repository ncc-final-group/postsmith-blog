import { NextRequest, NextResponse } from 'next/server';

import { getContentByBlogIdAndSequence } from '../../tbContents';
import { extractBlogId } from '../../utils/blogUtils';

export async function GET(request: NextRequest, context: { params: Promise<{ sequence: string }> }) {
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
    const sequence = parseInt(params.sequence);

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

export async function PUT(request: NextRequest, context: { params: Promise<{ sequence: string }> }) {
  try {
    const body = await request.json();
    const params = await context.params;
    const sequence = parseInt(params.sequence);

    if (isNaN(sequence)) {
      return NextResponse.json(
        {
          success: false,
          message: '유효하지 않은 게시글 ID입니다.',
        },
        { status: 400 },
      );
    }

    // 블로그 주소 추출
    const blogId = await extractBlogId(request);
    if (blogId === null) {
      return NextResponse.json(
        {
          success: false,
          message: '블로그를 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    // 기존 글 정보 조회하여 contentId 확인
    const existingContent = await getContentByBlogIdAndSequence(blogId, sequence);
    if (!existingContent) {
      return NextResponse.json(
        {
          success: false,
          message: '수정할 게시글을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    }

    // Spring API로 업데이트 요청
    const springResponse = await fetch(`http://localhost:8080/api/contents/${existingContent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: body.category,
        title: body.title,
        content: body.content,
        postType: body.postType ?? 'POSTS',
        isTemp: body.isTemp ?? false,
        isPublic: body.isPublic ?? true,
      }),
    });

    const responseText = await springResponse.text();

    if (!springResponse.ok) {
      throw new Error(`HTTP error! status: ${springResponse.status} - ${responseText}`);
    }

    return new NextResponse(responseText, {
      status: springResponse.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error updating content: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 },
    );
  }
}
