// StatisticsCards.tsx
import React from 'react';

import { VisitStats } from 'types/interfaces';

interface StatisticsCardsProps {
  stats: VisitStats;
}

export default function StatisticsCards({ stats }: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Today's Statistics */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-2 text-xs text-gray-500">오늘 조회수</div>
            <div className="text-xl font-bold text-gray-900">{stats.today.totalVisits}</div>
          </div>
          <div>
            <div className="mb-2 text-xs text-gray-500">어제 조회수</div>
            <div className="text-xl font-bold text-gray-900">{stats.today.uniqueVisits}</div>
          </div>
          <div>
            <div className="mb-2 text-xs text-gray-500">누적 조회수</div>
            <div className="text-xl font-bold text-blue-600">{stats.today.newVisits}</div>
          </div>
        </div>
      </div>

      {/* Visitors Statistics */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="mb-2 text-xs text-gray-500">오늘 방문자</div>
            <div className="text-xl font-bold text-gray-900">{stats.posts.totalPosts}</div>
          </div>
          <div>
            <div className="mb-2 text-xs text-orange-500">어제 방문자</div>
            <div className="text-xl font-bold text-gray-900">{stats.posts.newPosts}</div>
          </div>
          <div>
            <div className="mb-2 text-xs text-gray-500">누적 방문자</div>
            <div className="text-xl font-bold text-blue-600">{stats.posts.todayPosts}</div>
          </div>
        </div>
      </div>

      {/* Subscribers */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-center">
          <div className="mb-2 text-xs text-gray-500">구독자</div>
          <div className="text-xl font-bold text-gray-900">{stats.subscribers}</div>
        </div>
      </div>
    </div>
  );
}
