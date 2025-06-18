import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '로그아웃되었습니다.'
    });

    // 쿠키 삭제
    response.cookies.delete('userId');

    return response;

  } catch (error) {
    return NextResponse.json({ error: '로그아웃 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 