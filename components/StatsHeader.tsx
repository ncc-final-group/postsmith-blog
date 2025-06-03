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

export default function StatsHeader() {
  const [statsData, setStatsData] = useState<StatsData>({
    today: { views: 0, visitors: 0 },
    yesterday: { views: 0, visitors: 0 },
    total: { views: 0, visitors: 0 }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // API 응답 데이터 구조 확인
        console.log('API Response:', data);
        
        if (data && data.data) {
          // 날짜 계산
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          // 오늘과 어제의 데이터 찾기
          const todayData = data.data.filter((item: any) => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === today.getFullYear() &&
                   itemDate.getMonth() === today.getMonth() &&
                   itemDate.getDate() === today.getDate();
          });
          
          const yesterdayData = data.data.filter((item: any) => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === yesterday.getFullYear() &&
                   itemDate.getMonth() === yesterday.getMonth() &&
                   itemDate.getDate() === yesterday.getDate();
          });

          // 오늘 데이터 합산
          const todayStats = todayData.reduce((acc: any, curr: any) => ({
            views: acc.views + (curr.views || 0),
            visitors: acc.visitors + (curr.visitors || 0)
          }), { views: 0, visitors: 0 });

          // 어제 데이터 합산
          const yesterdayStats = yesterdayData.reduce((acc: any, curr: any) => ({
            views: acc.views + (curr.views || 0),
            visitors: acc.visitors + (curr.visitors || 0)
          }), { views: 0, visitors: 0 });

          // 전체 데이터 합산
          const totalStats = data.data.reduce((acc: any, curr: any) => ({
            views: acc.views + (curr.views || 0),
            visitors: acc.visitors + (curr.visitors || 0)
          }), { views: 0, visitors: 0 });

          console.log('Processed Data:', {
            today: todayStats,
            yesterday: yesterdayStats,
            total: totalStats
          });

          setStatsData({
            today: todayStats,
            yesterday: yesterdayStats,
            total: totalStats
          });
        }
      } catch (error) {
        console.error('통계 데이터를 불러오는데 실패했습니다:', error);
      }
    };

    fetchStats();
    
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes} 기준`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-800">방문 통계</h1>
          <div className="text-sm text-gray-500">{getCurrentDateString()}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">조회수</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">오늘</span>
                <span className="text-base font-medium text-gray-800">{formatNumber(statsData.today.views)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">어제</span>
                <span className="text-base font-medium text-gray-800">{formatNumber(statsData.yesterday.views)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">누적</span>
                <span className="text-base font-medium text-gray-800">{formatNumber(statsData.total.views)}</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">방문자</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">오늘</span>
                <span className="text-base font-medium text-gray-800">{formatNumber(statsData.today.visitors)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">어제</span>
                <span className="text-base font-medium text-gray-800">{formatNumber(statsData.yesterday.visitors)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">누적</span>
                <span className="text-base font-medium text-gray-800">{formatNumber(statsData.total.visitors)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 