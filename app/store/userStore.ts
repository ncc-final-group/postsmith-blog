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
      setUserId: (id: number) => set({ userId: id }),
      setUserInfo: (info: UserInfo) =>
        set({
          userInfo: info,
          userId: info.id,
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
        }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        userId: state.userId,
        userInfo: state.userInfo,
      }),
    },
  ),
);
