'use client';

import React from 'react';

import StatsChart from '../../../../components/StatsChart';
import StatsSummary from '../../../../components/StatsSummary';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">조회수 통계</h1>
        <div className="mx-auto w-4/5 rounded-[5%] border border-gray-400 py-6">
          <StatsSummary todayViews={0} yesterdayViews={0} totalViews={0} todayVisitors={0} yesterdayVisitors={0} totalVisitors={0} subscribers={0} />
        </div>
        <div className="my-6" />
        <div className="mx-auto w-4/5 rounded-[5%] border border-gray-400 p-6">
          <StatsChart />
        </div>
      </div>
    </div>
  );
}
