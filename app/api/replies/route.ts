import { NextRequest, NextResponse } from 'next/server';

interface RepliesCreateRequest {
  userId: number;
  contentId: number;
  parentReplyId?: number;
  contentText: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RepliesCreateRequest = await request.json();

    const { userId, contentId, parentReplyId, contentText } = body;

    // 입력 검증
    if (!userId || !contentId || !contentText?.trim()) {
      return NextResponse.json({ message: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    // Spring Boot API 호출 시도
    const springApiUrl = process.env.NEXT_PUBLIC_API_SERVER;

    try {
      const response = await fetch(`${springApiUrl}/api/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentId,
          parentReplyId: parentReplyId || null,
          contentText: contentText.trim(),
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        return NextResponse.json(responseData, { status: 201 });
      }
    } catch (springError) {
      // 임시 목업 응답 - Spring Boot 서버가 응답하지 않을 때
      const mockResponse = {
        id: Date.now(), // 임시 ID
        userId,
        contentId,
        parentReplyId,
        contentText: contentText.trim(),
        userNickname: '테스트 사용자',
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };
      return NextResponse.json(mockResponse, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ message: 'contentId가 필요합니다.' }, { status: 400 });
    }
    // Spring Boot API 호출 시도
    const springApiUrl = process.env.NEXT_PUBLIC_API_SERVER;

    try {
      const response = await fetch(`${springApiUrl}/api/replies/content/${contentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const responseData = await response.json();
        return NextResponse.json(responseData);
      }
    } catch (springError) {
      // 임시 목업 응답 - Spring Boot 서버가 응답하지 않을 때
      const mockReplies = [
        {
          id: 1,
          userId: 1,
          contentId: parseInt(contentId),
          parentReplyId: null,
          contentText: '첫 번째 목업 댓글입니다.',
          userNickname: '테스트 사용자1',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1일 전
          deletedAt: null,
        },
        {
          id: 2,
          userId: 2,
          contentId: parseInt(contentId),
          parentReplyId: null,
          contentText: '두 번째 목업 댓글입니다.',
          userNickname: '테스트 사용자2',
          createdAt: new Date(Date.now() - 43200000).toISOString(), // 12시간 전
          deletedAt: null,
        },
      ];

      return NextResponse.json(mockReplies);
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 },
    );
  }
}
