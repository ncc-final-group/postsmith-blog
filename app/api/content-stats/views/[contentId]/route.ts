import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { selectSQL } from '../../../../_lib/mysql/db';

// 총 조회수 조회 API
export async function GET(request: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  try {
    const { contentId } = await params;

    if (!contentId || isNaN(Number(contentId))) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    // content_views 테이블에서 해당 컨텐츠의 총 조회수 합계 조회
    const query = `
      SELECT COALESCE(SUM(views_count), 0) as total_views 
      FROM content_views 
      WHERE content_id = ?
    `;

    const result = await selectSQL<{ total_views: number }>(query, [Number(contentId)]);

    const totalViews = result.length > 0 ? result[0].total_views : 0;

    return NextResponse.json(totalViews);
  } catch (error) {
    assert(false, 'error');
  }
}
