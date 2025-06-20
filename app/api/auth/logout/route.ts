import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.',
    });

    // 모든 관련 쿠키 삭제
    response.cookies.delete('userId');
    response.cookies.delete('CLIENT_SESSION_ID');
    response.cookies.delete('sessionId');

    return response;
  } catch (error) {
    return NextResponse.json({ error: '로그아웃 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
