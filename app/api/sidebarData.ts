import { getPopularContentsByBlogId, getPopularContentsByBlogIdForAdmin, getRecentContents, getRecentContentsForAdmin } from './tbContents';
import { getRecentReplies, getRecentRepliesExcludingOwner } from './tbReplies';

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
    content_html: string;
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
    content_title: string;
    user: { nickname: string; profile_image?: string | null };
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
        content_html: String(popularContent.content_html),
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
        content_title: String(reply.content_title ?? '제목 없음'),
        user: {
          nickname: String(reply.user_nickname ?? '익명'),
          profile_image: reply.user_profile_image || null,
        },
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

// 관리자 대시보드용 사이드바 데이터 (블로그 소유자 제외한 댓글)
export async function getAdminSidebarData(blogId: number, blogOwnerId: number, userId?: number): Promise<SidebarData> {
  try {
    // 병렬로 데이터 불러오기 - 관리자 대시보드용으로 더 많은 데이터 가져오기 (is_public 상관없이)
    const [recentContents, popularContents, recentReplies] = await Promise.all([
      getRecentContentsForAdmin(blogId, 20), // 관리자용 함수 사용 (is_public 무시)
      getPopularContentsByBlogIdForAdmin(blogId), // 관리자용 함수 사용 (is_public 무시)
      getRecentRepliesExcludingOwner(blogId, blogOwnerId), // 블로그 소유자 제외한 댓글
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
        content_html: String(popularContent.content_html),
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
        content_title: String(reply.content_title ?? '제목 없음'),
        user: {
          nickname: String(reply.user_nickname ?? '익명'),
          profile_image: reply.user_profile_image || null,
        },
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
