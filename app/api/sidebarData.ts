import { getPopularContentsByBlogId, getRecentContents } from './tbContents';
import { getRecentReplies } from './tbReplies';

// 사이드바 데이터 타입 정의
export interface SidebarData {
  recentContents: Array<{
    sequence: number;
    title: string;
    content_html: string;
    content_plain: string;
    created_at: string;
    thumbnail?: string;
    category?: { id: number; name: string };
    reply_count: number;
  }>;
  popularContents: Array<{
    sequence: number;
    title: string;
    content_id: number;
    recent_reply_count: number;
    recent_visit_count: number;
    popularity_score: number;
    reply_count: number;
  }>;
  recentReplies: Array<{
    id: number;
    content_id: number;
    content: string;
    created_at: string;
    content_sequence: number;
    user: { nickname: string };
  }>;
}

// 사이드바 데이터를 한 번에 불러오는 함수
export async function getSidebarData(blogId: number, userId?: number): Promise<SidebarData> {
  try {
    // 병렬로 데이터 불러오기
    const [recentContents, popularContents, recentReplies] = await Promise.all([
      getRecentContents(blogId, 5, userId),
      getPopularContentsByBlogId(blogId, userId),
      getRecentReplies(blogId),
    ]);

    return {
      recentContents: recentContents.map((recentContent) => ({
        sequence: Number(recentContent.sequence),
        title: String(recentContent.title),
        content_html: String(recentContent.content_html),
        content_plain: String(recentContent.content_plain),
        created_at: String(recentContent.created_at),
        thumbnail: recentContent.thumbnail ? String(recentContent.thumbnail) : undefined,
        category: recentContent.category
          ? {
              id: Number(recentContent.category.id),
              name: String(recentContent.category.name),
            }
          : undefined,
        reply_count: Number(recentContent.reply_count ?? 0),
      })),
      popularContents: popularContents.map((popularContent) => ({
        sequence: Number(popularContent.sequence),
        title: String(popularContent.title),
        content_id: Number(popularContent.content_id),
        recent_reply_count: Number(popularContent.recent_reply_count),
        recent_visit_count: Number(popularContent.recent_visit_count),
        popularity_score: Number(popularContent.popularity_score),
        reply_count: Number(popularContent.recent_reply_count),
      })),
      recentReplies: recentReplies.map((reply) => ({
        id: Number(reply.id),
        content_id: Number(reply.content_id),
        content: String(reply.content),
        created_at: String(reply.created_at),
        content_sequence: Number(reply.content_sequence),
        user: { nickname: String(reply.user_nickname ?? '익명') },
      })),
    };
  } catch (error) {
    // 오류 발생 시 빈 데이터 반환
    return {
      recentContents: [],
      popularContents: [],
      recentReplies: [],
    };
  }
}
