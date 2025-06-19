'use client';

import { useEffect } from 'react';

import { useBlogStore } from '../app/store/blogStore';

interface BlogProviderProps {
  blogId: number;
  blogInfo: {
    id: number;
    nickname: string;
    description: string | null;
    logo_image: string | null;
    address: string;
  };
  children: React.ReactNode;
}

export default function BlogProvider({ blogId, blogInfo, children }: BlogProviderProps) {
  const setBlogInfo = useBlogStore((state) => state.setBlogInfo);

  useEffect(() => {
    setBlogInfo(blogInfo);
  }, [blogInfo, setBlogInfo]);

  return <>{children}</>;
}
