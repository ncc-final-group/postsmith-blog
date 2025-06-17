import { NextRequest, NextResponse } from 'next/server';
import { selectSQL } from '../../../../_lib/mysql/db';

// 오늘 조회수 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    
    if (!contentId || isNaN(Number(contentId))) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    // content_views 테이블에서 해당 컨텐츠의 오늘 조회수 조회
    const query = `
      SELECT COALESCE(SUM(views_count), 0) as today_views 
      FROM content_views 
      WHERE content_id = ? AND DATE(created_on) = CURDATE()
    `;
    
    const result = await selectSQL<{ today_views: number }>(query, [Number(contentId)]);
    
    const todayViews = result.length > 0 ? result[0].today_views : 0;
    
    return NextResponse.json(todayViews);
  } catch (error) {
    console.error('Error fetching today views:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 