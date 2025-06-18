import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 userId 확인
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // 간단한 사용자 정보 반환
    const userInfo = {
      id: parseInt(userId),
      email: `user${userId}@example.com`,
      nickname: `사용자${userId}`,
      profile_image: null,
      role: 'user',
    };

    return NextResponse.json({
      user: userInfo,
      message: '세션이 유효합니다.',
    });
  } catch (error) {
    return NextResponse.json({ error: '세션 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
