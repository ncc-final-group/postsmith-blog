'use client';

import { useEffect } from 'react';

import { useBlogStore } from '../store/blogStore';
import { SidebarDataProvider } from './SidebarDataProvider';
import { SidebarData } from '../api/sidebarData';

interface BlogProviderProps {
  blogId: number;
  blogInfo: {
    id: number;
    nickname: string;
    description: string | null;
    logo_image: string | null;
    address: string;
  };
  sidebarData?: SidebarData;
  children: React.ReactNode;
}

export default function BlogProvider({ blogId, blogInfo, sidebarData, children }: BlogProviderProps) {
  const setBlogInfo = useBlogStore((state) => state.setBlogInfo);

  useEffect(() => {
    setBlogInfo(blogInfo);
  }, [blogInfo, setBlogInfo]);

  if (sidebarData) {
    return (
      <SidebarDataProvider sidebarData={sidebarData}>
        {children}
      </SidebarDataProvider>
    );
  }

  return <>{children}</>;
}
