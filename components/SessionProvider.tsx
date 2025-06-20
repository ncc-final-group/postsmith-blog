'use client';

import { useEffect, useState } from 'react';

import { IUserSession, useSessionStore } from '../app/store/sessionStore';
import { useUserStore } from '../app/store/userStore';

interface SessionProviderProps {
  children: React.ReactNode;
  sessionData: IUserSession | null; // 서버에서 전달받은 세션 데이터
}

export default function SessionProvider({ children, sessionData }: SessionProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const { setSession, clearSession } = useSessionStore();
  const { setUserInfo, clearUser } = useUserStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // 클라이언트에서만 실행

    if (sessionData && sessionData.userId) {
      // 1. sessionStore에 저장
      setSession(sessionData);

      // 2. userStore에도 직접 저장 (더 확실한 동기화)
      if (sessionData.email && sessionData.userNickname) {
        setUserInfo({
          id: parseInt(sessionData.userId),
          email: sessionData.email,
          nickname: sessionData.userNickname,
          profile_image: sessionData.profileImage || null,
        });
      }
    } else {
      // 1. sessionStore 초기화
      clearSession();

      // 2. userStore도 초기화
      clearUser();
    }
  }, [isClient, sessionData, setSession, clearSession, setUserInfo, clearUser]);

  return <>{children}</>;
}
