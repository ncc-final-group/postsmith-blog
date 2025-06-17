'use client';

import { useEffect, useState } from 'react';
import { getTotalViewsByContentId } from '../lib/contentStats';

interface ViewsCounterProps {
  contentId: number;
}

export default function ViewsCounter({ contentId }: ViewsCounterProps) {
  const [views, setViews] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const totalViews = await getTotalViewsByContentId(contentId);
        setViews(totalViews);
      } catch (error) {
        // 오류 시 기본값 0 유지
        setViews(0);
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [contentId]);

  if (loading) {
    return <span>로딩중...</span>;
  }

  return <span>{views}</span>;
} 