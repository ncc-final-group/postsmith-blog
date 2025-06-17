'use client';

import { useEffect } from 'react';
import { getClientIP, recordContentView, recordContentVisit } from '../lib/contentStats';

interface ContentStatsProps {
  contentId: number;
  userId?: number;
}

export default function ContentStats({ contentId, userId }: ContentStatsProps) {
  useEffect(() => {
    // 페이지 로드 시 조회수와 방문자 수 기록
    const recordStats = async () => {
      try {
        const clientIP = getClientIP();
        
        // 조회수 기록
        await recordContentView(contentId);
        
        // 방문자 수 기록
        await recordContentVisit(contentId, userId, clientIP);
      } catch (error) {
        // 통계 기록 실패는 사용자 경험에 영향을 주지 않도록 조용히 처리
      }
    };

    recordStats();
  }, [contentId, userId]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
