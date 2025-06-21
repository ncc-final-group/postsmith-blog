import { NextRequest, NextResponse } from 'next/server';

const SPRING_API_URL = process.env.NEXT_PUBLIC_API_SERVER || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, title, content, slug, showInMenu } = body;

    // 필수 필드 검증
    if (!blogId || !title || !content) {
      return NextResponse.json(
        {
          success: false,
          message: '필수 필드가 누락되었습니다.',
          data: null,
        },
        { status: 400 },
      );
    }

    // 블로그 주소 조회 (blogId로 블로그 정보 가져오기)
    const blogResponse = await fetch(`${SPRING_API_URL}/api/blog/${blogId}`);
    if (!blogResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: '블로그 정보를 찾을 수 없습니다.',
          data: null,
        },
        { status: 404 },
      );
    }

    const blogData = await blogResponse.json();
    const blogAddress = blogData.address;

    if (!blogAddress) {
      return NextResponse.json(
        {
          success: false,
          message: '블로그 주소를 찾을 수 없습니다.',
          data: null,
        },
        { status: 404 },
      );
    }

    // Spring 백엔드로 PAGE 타입 컨텐츠 생성 요청 (ContentsRequestDto 형식)
    const springRequestBody = {
      blogId: blogId,
      postId: null, // 새 게시물이므로 null
      category: null, // 페이지는 카테고리가 없음
      title: title,
      content: content,
      postType: 'PAGE', // PAGE 타입으로 설정
      isTemp: false,
      isPublic: true,
    };

    const springResponse = await fetch(`${SPRING_API_URL}/api/contents/blog/${blogAddress}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(springRequestBody),
    });

    if (!springResponse.ok) {
      const errorText = await springResponse.text();
      return NextResponse.json(
        {
          success: false,
          message: `페이지 저장 실패: ${errorText}`,
          data: null,
        },
        { status: springResponse.status },
      );
    }

    const springData = await springResponse.json();

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        message: '페이지가 성공적으로 저장되었습니다.',
        data: {
          id: springData.id,
          sequence: springData.sequence,
          title: springData.title,
          slug: slug, // 클라이언트에서 생성한 슬러그 반환
          type: 'PAGE',
          showInMenu: showInMenu,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: '서버 오류가 발생했습니다.',
        data: null,
      },
      { status: 500 },
    );
  }
}
