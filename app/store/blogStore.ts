'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BlogInfo {
  id: number;
  nickname: string;
  description: string | null;
  logo_image: string | null;
  address: string;
}

export interface BlogTheme {
  id: number;
  themeId: number;
  themeName: string;
  themeHtml: string | null;
  themeCss: string | null;
  themeSetting: string | null;
  isActive: boolean;
}

interface BlogState {
  blogId: number | null;
  blogInfo: BlogInfo | null;
  currentTheme: BlogTheme | null;
  isLoading: boolean;
  error: string | null;
  setBlogId: (id: number) => void;
  setBlogInfo: (info: BlogInfo) => void;
  setCurrentTheme: (theme: BlogTheme) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearBlog: () => void;
  fetchCurrentTheme: (blogId: number) => Promise<void>;
  refreshCurrentTheme: () => Promise<void>;
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      blogId: null,
      blogInfo: null,
      currentTheme: null,
      isLoading: false,
      error: null,
      setBlogId: (id: number) => set({ blogId: id }),
      setBlogInfo: (info: BlogInfo) =>
        set({
          blogInfo: info,
          blogId: info.id,
          error: null,
        }),
      setCurrentTheme: (theme: BlogTheme) => set({ currentTheme: theme }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearBlog: () =>
        set({
          blogId: null,
          blogInfo: null,
          currentTheme: null,
          error: null,
          isLoading: false,
        }),
      fetchCurrentTheme: async (blogId: number) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(`/api/blog/theme-content?blogId=${blogId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              // ThemeData에서 BlogTheme으로 변환
              const themeData = result.data;
              const blogTheme = {
                id: themeData.blogId,
                themeId: themeData.themeId || 0,
                themeName: themeData.themeName,
                themeHtml: themeData.themeHtml,
                themeCss: themeData.themeCss,
                themeSetting: null,
                isActive: true,
              };
              set({ currentTheme: blogTheme });
            }
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '테마 조회 실패' });
        } finally {
          set({ isLoading: false });
        }
      },
      refreshCurrentTheme: async () => {
        const currentBlogId = get().blogId;
        if (currentBlogId) {
          await get().fetchCurrentTheme(currentBlogId);
        }
      },
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        blogId: state.blogId,
        blogInfo: state.blogInfo,
        currentTheme: state.currentTheme,
      }),
    },
  ),
);
