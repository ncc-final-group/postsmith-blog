'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface IUserSession {
  accessToken?: string;
  userId?: string;
  email?: string;
  role?: string;
  userNickname?: string;
  profileImage?: string;
}

interface SessionState {
  sessionData: IUserSession | null;

  // 세션 설정 (서버에서 받은 데이터 저장용)
  setSession: (session: IUserSession) => void;
  // 세션 초기화
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  sessionData: null,

  setSession: (session: IUserSession) => set({ sessionData: session }),

  clearSession: () => set({ sessionData: null }),
}));

// 편의 함수들 (값 가져오기만)
export const getCurrentSession = (): IUserSession | null => {
  const { sessionData } = useSessionStore.getState();
  return sessionData;
};

export const getCurrentUserId = (): string | null => {
  const { sessionData } = useSessionStore.getState();
  return sessionData?.userId || null;
};

export const getCurrentUserEmail = (): string | null => {
  const { sessionData } = useSessionStore.getState();
  return sessionData?.email || null;
};

export const getCurrentUserNickname = (): string | null => {
  const { sessionData } = useSessionStore.getState();
  return sessionData?.userNickname || null;
};

export const getAccessToken = (): string | null => {
  const { sessionData } = useSessionStore.getState();
  return sessionData?.accessToken || null;
};
