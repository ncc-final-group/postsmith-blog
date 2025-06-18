'use client';

import React from 'react';
import { useParams } from 'next/navigation';

import EachStatsSummary from '@components/EachStatsSummary';
import EachStatsChart from '@components/EachStatsChart';

export default function StatsPage() {
  const params = useParams();
  const contentId = params?.contentId ? parseInt(params.contentId as string, 10) : undefined;

  if (contentId === undefined || isNaN(contentId)) {
    return <div>유효하지 않은 콘텐츠 ID입니다.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">{contentId}번 게시물 조회수 통계</h1>
        <div className="mx-auto border border-gray-400 py-6">
          <EachStatsSummary contentId={contentId} />
        </div>
        <div className="my-6" />
        <div className="mx-auto  border border-gray-400 p-6">
          <EachStatsChart contentId={contentId} />
        </div>
      </div>
    </div>
  );
}
