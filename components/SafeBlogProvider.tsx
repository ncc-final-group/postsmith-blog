'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

import { SidebarData } from '../app/api/sidebarData';

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
  children: ReactNode;
}

const DynamicBlogProvider = dynamic(() => import('./BlogProvider'), {
  ssr: false,
  loading: () => null,
});

export default function SafeBlogProvider(props: BlogProviderProps) {
  return <DynamicBlogProvider {...props} />;
}
