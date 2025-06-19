import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { selectSQL } from '../../../../_lib/mysql/db';

// 총 방문자 수 조회 API
export async function GET(request: NextRequest, { params }: { params: Promise<{ contentId: string }> }) {
  try {
    const { contentId } = await params;

    if (!contentId || isNaN(Number(contentId))) {
      return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    }

    // content_visits 테이블에서 해당 컨텐츠의 총 방문자 수 조회
    const query = `
      SELECT COUNT(DISTINCT 
        CASE 
          WHEN user_id IS NOT NULL THEN user_id 
          ELSE ip_address 
        END
      ) as total_visits
      FROM content_visits 
      WHERE content_id = ?
    `;

    const result = await selectSQL<{ total_visits: number }>(query, [Number(contentId)]);

    const totalVisits = result.length > 0 ? result[0].total_visits : 0;

    return NextResponse.json(totalVisits);
  } catch (error) {
    assert(false, 'error');
  }
}
