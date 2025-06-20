'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserInfo {
  id: number;
  email: string;
  nickname: string;
  profile_image: string | null;
}

interface UserState {
  userId: number | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // 기본 액션들
  setUserId: (id: number) => void;
  setUserInfo: (info: UserInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      userInfo: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      setUserId: (id: number) => set({ userId: id }),

      setUserInfo: (info: UserInfo) =>
        set({
          userInfo: info,
          userId: info.id,
          isAuthenticated: true,
          error: null,
        }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      clearUser: () =>
        set({
          userId: null,
          userInfo: null,
          error: null,
          isLoading: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        userId: state.userId,
        userInfo: state.userInfo,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// 편의 함수들
export const getCurrentUserId = (): number | null => {
  const { userId } = useUserStore.getState();
  return userId;
};

export const getCurrentUser = (): UserInfo | null => {
  const { userInfo } = useUserStore.getState();
  return userInfo;
};

export const isUserAuthenticated = (): boolean => {
  const { isAuthenticated } = useUserStore.getState();
  return isAuthenticated;
};

// 로그아웃 함수
export const logout = () => {
  const store = useUserStore.getState();
  store.clearUser();
};
