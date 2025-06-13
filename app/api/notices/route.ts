import { NextRequest, NextResponse } from 'next/server';

const SPRING_API_URL = 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blogId, title, content, isImportant } = body;

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

    // Spring 백엔드로 NOTICE 타입 컨텐츠 생성 요청 (ContentsRequestDto 형식)
    const springRequestBody = {
      blogId: blogId,
      postId: null, // 새 게시물이므로 null
      category: null, // 공지사항은 카테고리 없음
      title: title,
      content: content,
      postType: 'NOTICE', // NOTICE 타입으로 설정
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
          message: `공지사항 저장 실패: ${errorText}`,
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
        message: '공지사항이 성공적으로 저장되었습니다.',
        data: {
          id: springData.id,
          sequence: springData.sequence,
          title: springData.title,
          type: 'NOTICE',
          isImportant: isImportant,
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
