import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@lib/redis';

interface UserSessionDto {
  "@class": string;
  accessToken: string;
  userId: string;
  email: string;
  role: string;
  userNickname: string;
  profileImage: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionKey } = await request.json();

    if (!sessionKey) {
      return NextResponse.json({ error: 'sessionKey가 필요합니다.' }, { status: 400 });
    }

    // Redis에서 세션 정보 가져오기
    const sessionData = await redis.get(sessionKey);

    if (!sessionData) {
      return NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 });
    }

    // JSON 파싱
    const userSession: UserSessionDto = JSON.parse(sessionData);

    // 사용자 정보 반환
    const userInfo = {
      id: parseInt(userSession.userId),
      email: userSession.email,
      nickname: userSession.userNickname,
      profile_image: userSession.profileImage,
      role: userSession.role,
      accessToken: userSession.accessToken
    };

    return NextResponse.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 