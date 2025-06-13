'use client';

import { useEffect } from 'react';

import { useUserStore } from '../store/userStore';

interface UserProviderProps {
  children: React.ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const setUserInfo = useUserStore((state) => state.setUserInfo);

  useEffect(() => {
    // 예시 사용자 정보 설정
    setUserInfo({
      id: 1,
      email: 'email',
      nickname: '성현',
      profile_image: '프로필이미지',
    });
  }, [setUserInfo]);

  return <>{children}</>;
}
