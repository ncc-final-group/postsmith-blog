import { NextRequest, NextResponse } from 'next/server';

const SPRING_API_URL = process.env.NEXT_PUBLIC_API_SERVER || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get('blogId') || '1';

    // Spring Boot API로 요청 전달
    const apiUrl = `${SPRING_API_URL}/api/media/stats?blogId=${blogId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      // Spring Boot 서버가 응답하지 않을 때 더미 통계 데이터 반환
      const dummyStats = {
        totalCount: 5,
        totalSize: 5120000, // 5MB
        typeCounts: {
          image: 3,
          video: 1,
          file: 1,
        },
      };

      return NextResponse.json(dummyStats);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // 오류 발생 시 기본 통계 데이터 반환
    const defaultStats = {
      totalCount: 0,
      totalSize: 0,
      typeCounts: {
        image: 0,
        video: 0,
        file: 0,
      },
    };

    return NextResponse.json(defaultStats);
  }
}
