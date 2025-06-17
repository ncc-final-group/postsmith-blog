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
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log('댓글 생성 요청:', { userId, contentId, parentReplyId, contentText });

    // Spring Boot API 호출 시도
    const springApiUrl = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${springApiUrl}/api/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else {
        console.warn('Spring Boot 서버 응답 오류:', response.status);
        throw new Error('Spring Boot 서버 오류');
      }
    } catch (springError) {
      console.error('Spring Boot 서버 연결 실패:', springError);
      
      // 임시 목업 응답 - Spring Boot 서버가 응답하지 않을 때
      const mockResponse = {
        id: Date.now(), // 임시 ID
        userId,
        contentId,
        parentReplyId,
        contentText: contentText.trim(),
        userNickname: '테스트 사용자',
        createdAt: new Date().toISOString(),
        deletedAt: null
      };
      
      console.log('목업 댓글 응답:', mockResponse);
      return NextResponse.json(mockResponse, { status: 201 });
    }

  } catch (error) {
    console.error('댓글 작성 API 오류:', error);
    return NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json(
        { message: 'contentId가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log('댓글 조회 요청:', contentId);

    // Spring Boot API 호출 시도
    const springApiUrl = process.env.NEXT_PUBLIC_API_SERVER || 'http://localhost:8080';
    
    try {
      const response = await fetch(`${springApiUrl}/api/replies/content/${contentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        return NextResponse.json(responseData);
      } else {
        console.warn('Spring Boot 서버 응답 오류:', response.status);
        throw new Error('Spring Boot 서버 오류');
      }
    } catch (springError) {
      console.error('Spring Boot 서버 연결 실패:', springError);
      
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
          deletedAt: null
        },
        {
          id: 2,
          userId: 2,
          contentId: parseInt(contentId),
          parentReplyId: null,
          contentText: '두 번째 목업 댓글입니다.',
          userNickname: '테스트 사용자2',
          createdAt: new Date(Date.now() - 43200000).toISOString(), // 12시간 전
          deletedAt: null
        }
      ];
      
      console.log('목업 댓글 목록:', mockReplies);
      return NextResponse.json(mockReplies);
    }

  } catch (error) {
    console.error('댓글 조회 API 오류:', error);
    return NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 