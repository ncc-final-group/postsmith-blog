'use client';

import React from 'react';

interface StatsSummaryProps {
  todayViews: number;
  yesterdayViews: number;
  totalViews: number;
  todayVisitors: number;
  yesterdayVisitors: number;
  totalVisitors: number;
  subscribers: number;
}

export default function StatsSummary({ todayViews, yesterdayViews, totalViews, todayVisitors, yesterdayVisitors, totalVisitors, subscribers }: StatsSummaryProps) {
  return (
    <div className="pf-6 flex w-full items-center justify-start gap-8 font-sans">
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">오늘 조회수</div>
        <div className="text-2xl font-medium text-black">{todayViews}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">어제 조회수</div>
        <div className="text-2xl font-medium text-black">{yesterdayViews}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">누적 조회수</div>
        <div className="text-2xl font-medium text-black">{totalViews}</div>
      </div>
      <div className="mx-4 h-12 border-l border-gray-400" />
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">오늘 방문자</div>
        <div className="text-2xl font-medium text-black">{todayVisitors}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">어제 방문자</div>
        <div className="text-2xl font-medium text-black">{yesterdayVisitors}</div>
      </div>
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">누적 방문자</div>
        <div className="text-2xl font-medium text-black">{totalVisitors}</div>
      </div>
      <div className="mx-4 h-12 border-l border-gray-400" />
      <div className="flex-1 text-center">
        <div className="mb-2 text-sm text-gray-500">구독자</div>
        <div className="text-2xl font-medium text-black">{subscribers}</div>
      </div>
    </div>
  );
}
