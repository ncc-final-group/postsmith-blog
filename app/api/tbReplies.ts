import { selectSQL } from '../_lib/mysql/db';

export interface Reply {
  id: number;
  user_id: number;
  content_id: number;
  reply_id: number | null;
  content: string;
  created_at: string;
  deleted_at: string | null;
  user_nickname?: string;
  user_profile_image?: string | null;
  content_sequence?: number;
}

export const getRepliesByContentId = async (contentId: number): Promise<Reply[]> => {
  const query = `
    SELECT r.id, r.user_id, r.content_id, r.reply_id, r.content as content, r.created_at, r.deleted_at,
           u.nickname as user_nickname, u.profile_image as user_profile_image, c.sequence as content_sequence
    FROM replies r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN contents c ON r.content_id = c.id
    WHERE r.content_id = ? AND r.deleted_at IS NULL
    ORDER BY r.created_at ASC
  `;

  return await selectSQL<Reply>(query, [contentId]);
};

export const getRecentReplies = async (blogId: number, limit: number = 5): Promise<Reply[]> => {
  const query = `
    SELECT r.id, r.user_id, r.content_id, r.reply_id, r.content as content, r.created_at, r.deleted_at,
           u.nickname as user_nickname, u.profile_image as user_profile_image, c.sequence as content_sequence
    FROM replies r
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN contents c ON r.content_id = c.id
    WHERE r.deleted_at IS NULL AND c.blog_id = ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `;

  return await selectSQL<Reply>(query, [blogId, limit]);
};
