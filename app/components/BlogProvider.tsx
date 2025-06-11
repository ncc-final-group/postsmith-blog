'use client';

import { useBlogStore } from '../store/blogStore';
import { useEffect } from 'react';

interface BlogProviderProps {
  blogId: number;
}

export default function BlogProvider({ blogId }: BlogProviderProps) {
  const setBlogId = useBlogStore((state) => state.setBlogId);

  useEffect(() => {
    setBlogId(blogId);
  }, [blogId, setBlogId]);

  return null;
} 