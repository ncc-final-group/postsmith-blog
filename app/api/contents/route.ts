import { NextRequest, NextResponse } from 'next/server';
/* eslint-disable no-console, object-curly-newline */

import { getContentsByBlogId } from '../tbContents';
import { extractBlogId } from '../utils/blogUtils';

export async function GET(request: NextRequest) {
  try {
    const blogId = await extractBlogId(request);
    
    // 블로그가 존재하지 않으면 404 반환
    if (blogId === null) {
      return NextResponse.json({
        success: false,
        message: '블로그를 찾을 수 없습니다.',
        data: []
      }, { status: 404 });
    }
    
    // 실제 데이터베이스에서 콘텐츠 데이터 가져오기
    const contents = await getContentsByBlogId(blogId);

    return NextResponse.json({
      success: true,
      data: contents,
      message: 'Contents fetched successfully'
    });
  } catch (error) {
    // 에러 발생시 빈 배열 반환
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Using fallback contents due to error: ' + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // x-subdomain 헤더에서 블로그 주소 추출 (middleware에서 설정)
    let blogAddress: string | null = request.headers.get('x-subdomain');

    // blogId가 전달되고 서브도메인이 없는 경우 Spring에서 주소 조회
    if (!blogAddress && body.blogId) {
      try {
        const blogRes = await fetch(`http://localhost:8080/api/blog/${body.blogId}`);
        if (blogRes.ok) {
          const blogJson = await blogRes.json();
          if (blogJson && blogJson.address) {
            blogAddress = blogJson.address as string;
          }
        }
      } catch (e) {
        // swallow error, blogAddress remains null
      }
    }

    if (!blogAddress) {
      return new NextResponse(
        JSON.stringify({ error: '블로그 주소(subdomain)를 찾을 수 없습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Spring ContentsController 엔드포인트로 전달
    const springResponse = await fetch(
      `http://localhost:8080/api/contents/blog/${blogAddress}/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // DTO 필드 매핑
          category: body.category,
          title: body.title,
          content: body.content,
          postType: body.postType ?? 'POSTS', // 기본값
          isTemp: body.isTemp ?? false,
          isPublic: body.isPublic ?? true,
        }),
      }
    );

    // 응답 로깅
    const responseText = await springResponse.text();
    console.log('Spring server response:', {
      status: springResponse.status,
      body: responseText
    });

    // Spring 서버의 응답을 그대로 반환
    return new NextResponse(responseText, {
      status: springResponse.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 