import { NextResponse } from 'next/server';

interface StatsSummary {
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
        views: Math.floor(Math.random() * 100) + 50, // 50-150 사이의 랜덤 조회수
        visitors: Math.floor(Math.random() * 50) + 20, // 20-70 사이의 랜덤 방문자
      };
    });

    // 오늘의 통계 (배열의 마지막 요소)
    const todayStats = data[data.length - 1];
    
    // 어제의 통계 (배열의 마지막에서 두 번째 요소)
    const yesterdayStats = data[data.length - 2] || { views: 0, visitors: 0 };

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
      yesterday: {
        views: yesterdayStats.views,
        visitors: yesterdayStats.visitors,
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
    return NextResponse.json(
      { error: 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
} 