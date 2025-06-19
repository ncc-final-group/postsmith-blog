'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BlogInfo {
  id: number;
  nickname: string;
  description: string | null;
  logo_image: string | null;
  address: string;
}

interface BlogState {
  blogId: number | null;
  blogInfo: BlogInfo | null;
  isLoading: boolean;
  error: string | null;
  setBlogId: (id: number) => void;
  setBlogInfo: (info: BlogInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearBlog: () => void;
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set) => ({
      blogId: null,
      blogInfo: null,
      isLoading: false,
      error: null,
      setBlogId: (id: number) => set({ blogId: id }),
      setBlogInfo: (info: BlogInfo) =>
        set({
          blogInfo: info,
          blogId: info.id,
          error: null,
        }),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearBlog: () =>
        set({
          blogId: null,
          blogInfo: null,
          error: null,
          isLoading: false,
        }),
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        blogId: state.blogId,
        blogInfo: state.blogInfo,
      }),
    },
  ),
);
