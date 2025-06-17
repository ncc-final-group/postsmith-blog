import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // 쿠키에서 세션 키 확인
    const cookieStore = await cookies();
    const sessionKey = cookieStore.get('sessionKey')?.value;

    if (!sessionKey) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // Redis에서 세션 정보 확인 (여기서는 간단히 세션키만 확인)
    // 실제로는 Redis에서 세션 정보를 가져와야 함
    return NextResponse.json({
      sessionKey,
      message: '세션이 유효합니다.'
    });

  } catch (error) {
    return NextResponse.json({ error: '세션 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 