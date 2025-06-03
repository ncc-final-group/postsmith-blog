import { NextResponse } from 'next/server';

interface StatsSummary {
  today: {
    views: number;
    visitors: number;
  };
  total: {
    views: number;
    visitors: number;
  };
  average: {
    views: number;
    visitors: number;
  };
  data: Array<{
    date: string;
    views: number;
    visitors: number;
  }>;
}

export async function GET() {
  try {
    const today = new Date();
    const data = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100), // 임시 조회수 데이터
        visitors: Math.floor(Math.random() * 50), // 임시 방문자 데이터
      };
    });

    // 오늘의 통계
    const todayStats = data[data.length - 1];

    // 전체 통계 계산
    const totalViews = data.reduce((sum, day) => sum + day.views, 0);
    const totalVisitors = data.reduce((sum, day) => sum + day.visitors, 0);
    const avgViews = Math.round(totalViews / data.length);
    const avgVisitors = Math.round(totalVisitors / data.length);

    const summary: StatsSummary = {
      today: {
        views: todayStats.views,
        visitors: todayStats.visitors,
      },
      total: {
        views: totalViews,
        visitors: totalVisitors,
      },
      average: {
        views: avgViews,
        visitors: avgVisitors,
      },
      data: data,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
} 