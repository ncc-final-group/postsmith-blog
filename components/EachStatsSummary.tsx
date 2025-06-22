'use client';

import React, { useEffect, useState } from 'react';

interface StatsData {
  today: {
    views: number;
    visitors: number;
  };
  yesterday: {
    views: number;
    visitors: number;
  };
  total: {
    views: number;
    visitors: number;
  };
}

type Props = {
  contentId: number;
};

export default function EachStatsSummary({ contentId }: Props) {
  const [statsData, setStatsData] = useState<StatsData>({
    today: { views: 0, visitors: 0 },
    yesterday: { views: 0, visitors: 0 },
    total: { views: 0, visitors: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const [viewRes, visitRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Stats/each/view/${contentId}`),
          fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Stats/each/visit/${contentId}`),
        ]);

        if (!viewRes.ok || !visitRes.ok) {
          throw new Error(`통계 API 응답 오류: view=${viewRes.status}, visit=${visitRes.status}`);
        }

        const viewData = await viewRes.json();
        const visitData = await visitRes.json();

        setStatsData({
          today: {
            views: viewData.todayViewCount || 0,
            visitors: visitData.todayVisitCount || 0,
          },
          yesterday: {
            views: viewData.yesterdayViewCount || 0,
            visitors: visitData.yesterdayVisitCount || 0,
          },
          total: {
            views: viewData.totalViewCount || 0,
            visitors: visitData.totalVisitCount || 0,
          },
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '통계 데이터를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 5 * 60 * 1000); // 5분마다 갱신
    return () => clearInterval(interval);
  }, [contentId]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="pf-6 flex w-full items-center justify-start gap-8 font-sans">
        <div className="flex w-full animate-pulse justify-between">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="mx-auto mb-2 h-4 w-20 rounded bg-gray-200"></div>
              <div className="mx-auto h-8 w-16 rounded bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-6 flex w-full items-center justify-center font-sans">
        <div className="py-4 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="pf-6 flex w-full items-center justify-start gap-8 font-sans">
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">오늘 조회수</div>
        <div className="text-2xl font-medium text-black">{formatNumber(statsData.today.views)}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">어제 조회수</div>
        <div className="text-2xl font-medium text-black">{formatNumber(statsData.yesterday.views)}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">누적 조회수</div>
        <div className="text-2xl font-medium text-black">{formatNumber(statsData.total.views)}</div>
      </div>
      <div className="mx-4 h-12 border-l border-gray-400" />
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">오늘 방문자</div>
        <div className="text-2xl font-medium text-black">{formatNumber(statsData.today.visitors)}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">어제 방문자</div>
        <div className="text-2xl font-medium text-black">{formatNumber(statsData.yesterday.visitors)}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">누적 방문자</div>
        <div className="text-2xl font-medium text-black">{formatNumber(statsData.total.visitors)}</div>
      </div>
    </div>
  );
}
