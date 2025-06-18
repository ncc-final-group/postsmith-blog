import { cookies } from 'next/headers';

// 쿠키에서 현재 로그인한 사용자 정보 가져오기 (서버 컴포넌트 전용)
export async function getCurrentUser(): Promise<{ id: number; email: string; nickname: string; role: string } | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return null;
    }

    // 간단한 사용자 정보 반환 (실제로는 DB에서 조회해야 함)
    return {
      id: parseInt(userId),
      email: `user${userId}@example.com`,
      nickname: `사용자${userId}`,
      role: 'user'
    };
  } catch (error) {
    return null;
  }
} 