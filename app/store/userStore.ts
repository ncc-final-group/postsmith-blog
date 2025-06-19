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

  // 새로 추가된 액션들
  initializeAuth: () => void;
  updateUserFromSession: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
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

      // 초기 인증 상태 설정 (임시로 사용자 ID 1 사용)
      initializeAuth: () => {
        const { userInfo } = get();

        // 이미 사용자가 설정되어 있지 않다면 임시 사용자 설정
        if (!userInfo) {
          set({
            userInfo: {
              id: 1,
              email: 'temp@example.com',
              nickname: '임시 사용자',
              profile_image: null,
            },
            userId: 1,
            isAuthenticated: true,
            error: null,
          });
        }
      },

      // 세션에서 사용자 정보 업데이트 (나중에 구현)
      updateUserFromSession: async () => {
        set({ isLoading: true });

        try {
          // TODO: 실제 세션 API 호출로 교체
          // const response = await fetch('/api/auth/session');
          // if (!response.ok) {
          //   throw new Error('세션 정보를 가져올 수 없습니다');
          // }
          // const sessionData = await response.json();

          // 자동 로그인 제거 - 세션이 없으면 로그아웃 상태 유지
          set({ isLoading: false });
        } catch (error) {
          // 세션에서 사용자 정보를 가져오는데 실패했습니다
          set({
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
            isLoading: false,
          });
          // 에러 발생시 로그아웃 처리
          get().clearUser();
        }
      },
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

// 임시 로그인 함수 (테스트용)
export const tempLogin = (nickname: string = '테스트 사용자') => {
  const store = useUserStore.getState();
  store.setUserInfo({
    id: 1,
    email: 'test@example.com',
    nickname,
    profile_image: null,
  });
};

// 로그아웃 함수
export const logout = () => {
  const store = useUserStore.getState();
  store.clearUser();
};
