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
    if (sessionData && sessionData.user) {
      // 세션에서 사용자 정보가 있으면 store에 저장
      setUserInfo({
        id: sessionData.user.id,
        email: sessionData.user.email,
        nickname: sessionData.user.nickname,
        profile_image: sessionData.user.profile_image,
      });
    } else {
      // 세션이 없으면 사용자 정보 초기화
      clearUser();
    }
  }, [sessionData, setUserInfo, clearUser]);

  return <>{children}</>;
} 