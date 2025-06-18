'use client';

import React, { createContext, ReactNode, useContext } from 'react';

// 사이드바 데이터 타입 정의
interface SidebarData {
  recentContents: Array<{
    sequence: number;
    title: string;
    content_html: string;
    content_plain: string;
    created_at: string;
    thumbnail?: string;
    category?: { id: number; name: string };
    reply_count: number;
  }>;
  popularContents: Array<{
    sequence: number;
    title: string;
    content_id: number;
    recent_reply_count: number;
    recent_visit_count: number;
    popularity_score: number;
    reply_count: number;
  }>;
  recentReplies: Array<{
    id: number;
    content_id: number;
    content: string;
    created_at: string;
    content_sequence: number;
    user: { nickname: string };
  }>;
}

// Context 생성
const SidebarDataContext = createContext<SidebarData | null>(null);

// Provider Props 타입
interface SidebarDataProviderProps {
  children: ReactNode;
  sidebarData: SidebarData;
}

// Provider 컴포넌트
export function SidebarDataProvider({ children, sidebarData }: SidebarDataProviderProps) {
  return <SidebarDataContext.Provider value={sidebarData}>{children}</SidebarDataContext.Provider>;
}

// Hook for using sidebar data
export function useSidebarData(): SidebarData {
  const context = useContext(SidebarDataContext);
  if (!context) {
    throw new Error('useSidebarData must be used within a SidebarDataProvider');
  }
  return context;
}

export default SidebarDataProvider;
