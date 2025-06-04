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

export default function StatsSummary() {
  const [statsData, setStatsData] = useState<StatsData>({
    today: { views: 0, visitors: 0 },
    yesterday: { views: 0, visitors: 0 },
    total: { views: 0, visitors: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // API 응답에서 직접 필요한 데이터 추출
        setStatsData({
          today: {
            views: data.today?.views || 0,
            visitors: data.today?.visitors || 0
          },
          yesterday: {
            views: data.yesterday?.views || 0,
            visitors: data.yesterday?.visitors || 0
          },
          total: {
            views: data.total?.views || 0,
            visitors: data.total?.visitors || 0
          }
        });
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '통계 데이터를 불러오는데 실패했습니다');
        // 에러 시 기본값 유지
        setStatsData({
          today: { views: 0, visitors: 0 },
          yesterday: { views: 0, visitors: 0 },
          total: { views: 0, visitors: 0 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // 5분마다 데이터 갱신
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="pf-6 flex w-full items-center justify-start gap-8 font-sans">
        <div className="animate-pulse flex w-full justify-between">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="mb-2 h-4 bg-gray-200 rounded w-20 mx-auto"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-6 flex w-full items-center justify-center font-sans">
        <div className="text-red-500 text-center py-4">
          {error}
        </div>
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
      <div className="mx-4 h-12 border-l border-gray-400" />
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">구독자</div>
        <div className="text-2xl font-medium text-black">0</div>
      </div>
    </div>
  );
}
