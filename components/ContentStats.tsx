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
      const clientIP = getClientIP();
      // 조회수 기록
      const viewResult = await recordContentView(contentId);

      // 방문자 수 기록
      const visitResult = await recordContentVisit(contentId, userId, clientIP);
    };

    recordStats();
  }, [contentId, userId]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
