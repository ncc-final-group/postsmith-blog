'use server';

import { cookies } from 'next/headers';

import { IUserSession } from '@app/store/userStore';
import redisClient from '@lib/redis';

/**
 * Redis에서 현재 세션 정보를 가져오는 서버 액션
 */
export async function getSessionFromRedis(): Promise<IUserSession | undefined> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('CLIENT_SESSION_ID');
  const sessionData = await redisClient.get(sessionId?.value || '');
  const sessionObject = JSON.parse(sessionData || '{}') as IUserSession;
  return Object.keys(sessionObject).length > 0 ? sessionObject : undefined;
}

/**
 * 세션 ID로 Redis에서 세션 정보를 가져오는 함수
 */
export async function getSessionById(sessionId: string): Promise<IUserSession | undefined> {
  try {
    if (!sessionId) {
      return undefined;
    }

    const sessionData = await redisClient.get(sessionId);

    if (!sessionData) {
      return undefined;
    }

    const sessionObject = JSON.parse(sessionData) as IUserSession;
    return Object.keys(sessionObject).length > 0 ? sessionObject : undefined;
  } catch (error) {
    // Redis 세션 조회 중 오류 발생
    return undefined;
  }
}
