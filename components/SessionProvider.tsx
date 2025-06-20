'use client';

import { useEffect } from 'react';

import { useUserStore } from '../app/store/userStore';

interface SessionProviderProps {
  children: React.ReactNode;
  sessionData: any; // 서버에서 전달받은 세션 데이터
}

export default function SessionProvider({ children, sessionData }: SessionProviderProps) {
  const { setUserInfo, clearUser } = useUserStore();

  useEffect(() => {
    if (sessionData && sessionData.userId) {
      // 세션에서 사용자 정보가 있으면 store에 저장
      setUserInfo({
        id: parseInt(sessionData.userId),
        email: sessionData.email || '',
        nickname: sessionData.userNickname || '',
        profile_image: sessionData.profileImage || null,
      });
    } else {
      // 세션이 없으면 사용자 정보 초기화
      clearUser();
    }
  }, [sessionData, setUserInfo, clearUser]);

  return <>{children}</>;
}
