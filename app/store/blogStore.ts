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
          const response = await fetch(`/api/manage/blog-themes/${blogId}`);
          if (response.ok) {
            const theme = await response.json();
            set({ currentTheme: theme });
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '테마 조회 실패' });
        } finally {
          set({ isLoading: false });
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
