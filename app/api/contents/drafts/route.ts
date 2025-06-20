import { NextRequest, NextResponse } from 'next/server';

import { extractBlogId } from '../../utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'POSTS', 'PAGE', 'NOTICE' 또는 null (전체)
    const blogIdParam = url.searchParams.get('blogId'); // URL 파라미터로 전달된 blogId

    // URL 파라미터로 blogId가 전달된 경우 우선 사용, 그렇지 않으면 extractBlogId 사용
    let blogId: number | null = null;
    if (blogIdParam) {
      blogId = parseInt(blogIdParam);
    } else {
      blogId = await extractBlogId(request);
    }

    const SPRING_API_URL = process.env.NEXT_PUBLIC_API_SERVER;

    // 블로그가 존재하지 않으면 404 반환
    if (blogId === null || isNaN(blogId)) {
      return NextResponse.json(
        {
          success: false,
          message: '블로그를 찾을 수 없습니다.',
          data: [],
        },
        { status: 404 },
      );
    }

    // Spring API로 임시저장 콘텐츠 조회 요청
    let springUrl = `${SPRING_API_URL}/api/contents/blog/${blogId}/drafts`;
    if (type) {
      springUrl += `?type=${type.toUpperCase()}`;
    }

    const springResponse = await fetch(springUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!springResponse.ok) {
      throw new Error(`Spring API error: ${springResponse.status}`);
    }

    const data = await springResponse.json();

    return NextResponse.json({
      success: true,
      data: data,
      message: '임시저장 콘텐츠를 성공적으로 가져왔습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: '임시저장 콘텐츠를 가져오는 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 },
    );
  }
}
