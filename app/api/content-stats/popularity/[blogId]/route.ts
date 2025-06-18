import { assert } from 'console';

import { NextRequest, NextResponse } from 'next/server';

import { selectSQL } from '../../../../_lib/mysql/db';

// 인기글 점수 계산 API (최근 한 달 기준: 댓글 수 + 방문자 수)
export async function GET(request: NextRequest, { params }: { params: Promise<{ blogId: string }> }) {
  try {
    const { blogId } = await params;

    if (!blogId || isNaN(Number(blogId))) {
      return NextResponse.json({ error: 'Invalid blog ID' }, { status: 400 });
    }

    // 최근 한 달간의 댓글 수와 방문자 수를 합쳐서 인기 점수 계산
    const query = `
      SELECT 
        c.id as content_id,
        c.sequence,
        c.title,
        COALESCE(recent_replies.reply_count, 0) as recent_reply_count,
        COALESCE(recent_visits.visit_count, 0) as recent_visit_count,
        (COALESCE(recent_replies.reply_count, 0) + COALESCE(recent_visits.visit_count, 0)) as popularity_score
      FROM contents c
      LEFT JOIN (
        SELECT 
          r.content_id,
          COUNT(*) as reply_count
        FROM replies r
        WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        GROUP BY r.content_id
      ) recent_replies ON c.id = recent_replies.content_id
      LEFT JOIN (
        SELECT 
          cv.content_id,
          COUNT(DISTINCT 
            CASE 
              WHEN cv.user_id IS NOT NULL THEN cv.user_id 
              ELSE cv.ip 
            END
          ) as visit_count
        FROM content_visits cv
        WHERE cv.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        GROUP BY cv.content_id
      ) recent_visits ON c.id = recent_visits.content_id
      WHERE c.blog_id = ? AND c.is_public = 1
      ORDER BY popularity_score DESC, c.created_at DESC
      LIMIT 10
    `;

    const result = await selectSQL<{
      content_id: number;
      sequence: number;
      title: string;
      recent_reply_count: number;
      recent_visit_count: number;
      popularity_score: number;
    }>(query, [Number(blogId)]);

    return NextResponse.json(result);
  } catch (error) {
    assert(false, 'error');
  }
}
