import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 });
    }

    // 간단한 사용자 정보 생성
    const userInfo = {
      id: parseInt(userId),
      email: `user${userId}@example.com`,
      nickname: `사용자${userId}`,
      profile_image: null,
      role: 'user',
    };

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      user: userInfo,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
