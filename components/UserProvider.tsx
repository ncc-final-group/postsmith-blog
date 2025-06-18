'use client';

import { useEffect } from 'react';

import { useUserStore } from '../app/store/userStore';

interface UserProviderProps {
  children: React.ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const { updateUserFromSession } = useUserStore();

  useEffect(() => {
    // 세션에서 사용자 정보 업데이트만 수행 (자동 로그인 제거)
    updateUserFromSession();
  }, [updateUserFromSession]);

  return <>{children}</>;
}
