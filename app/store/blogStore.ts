'use client';

import { create } from 'zustand';

interface BlogState {
  blogId: number | null;
  setBlogId: (id: number) => void;
}

export const useBlogStore = create<BlogState>((set) => ({
  blogId: null,
  setBlogId: (id: number) => set({ blogId: id }),
})); 