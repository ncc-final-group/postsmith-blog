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
        <div className="my-6" />
        <div className="mx-auto mb-6 w-full rounded-lg border border-gray-200 bg-white p-6">
          <RecentPosts
            posts={[
              {
                id: 1,
                title: 'db',
                excerpt: '1dbhtml → pure text이걸 얼마나 저장할거…',
                imageUrl: undefined,
                commentCount: 0,
                likeCount: 0,
              },
              {
                id: 2,
                title: '강아지',
                excerpt: '',
                imageUrl: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d',
                commentCount: 0,
                likeCount: 0,
              },
              {
                id: 3,
                title: '카테고리1 글1',
                excerpt: '카테고리1 글1',
                imageUrl: undefined,
                commentCount: 0,
                likeCount: 0,
              },
              {
                id: 4,
                title: '테스트',
                excerpt: '안녕하세요',
                imageUrl: undefined,
                commentCount: 0,
                likeCount: 0,
              },
            ]}
          />
        </div>
        <div className="my-6" />
        <div className="mx-auto mb-6 w-full rounded-lg border border-gray-200 bg-white p-6">
          <HotPosts
            posts={[
              {
                id: 11,
                title: 'Hot 1',
                excerpt: '이 글은 인기글입니다.',
                imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
                commentCount: 5,
                likeCount: 12,
              },
              {
                id: 12,
                title: 'Hot 2',
                excerpt: '많은 사람들이 본 글.',
                imageUrl: undefined,
                commentCount: 2,
                likeCount: 8,
              },
              {
                id: 13,
                title: 'Hot 3',
                excerpt: '조회수와 공감이 많은 글.',
                imageUrl: undefined,
                commentCount: 7,
                likeCount: 20,
              },
              {
                id: 14,
                title: 'Hot 4',
                excerpt: '이것도 인기글!',
                imageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
                commentCount: 1,
                likeCount: 5,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
