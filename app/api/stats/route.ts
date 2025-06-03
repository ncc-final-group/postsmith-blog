import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 임시 데이터 생성 (실제로는 데이터베이스에서 가져와야 함)
    const today = new Date();
    const data = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return {
        date: date.toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100),
        visitors: Math.floor(Math.random() * 50),
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats data' },
      { status: 500 }
    );
  }
} 