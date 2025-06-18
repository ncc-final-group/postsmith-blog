'use client';

import React from 'react';

import HotPosts from '@components/HotPosts';
import RecentPosts from '@components/RecentPosts';
import StatsChart from '@components/StatsChart';
import StatsSummary from '@components/StatsSummary';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container w-full px-4">
        <h1 className="mb-4 text-4xl font-bold text-black">방문 통계</h1>
        <div className="mx-auto mb-6 w-full rounded-lg border border-gray-200 bg-white p-6">
          <StatsSummary />
        </div>
        <div className="my-6" />
        <div className="mx-auto mb-6 w-full rounded-lg border border-gray-200 bg-white p-6">
          <div className="h-[500px] w-full">
            <StatsChart />
          </div>
        </div>
      </div>
    </div>
  );
}
