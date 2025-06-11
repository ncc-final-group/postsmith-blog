import { selectSQL } from '../_lib/mysql/db';

export interface Reply {
  id: number;
  content_id: number;
  user_id: number;
  content_html: string;
  content_plain: string;
  created_at: string;
  updated_at: string;
  user?: {
    nickname: string;
    profile_image?: string;
  };
  content: {
    sequence: number;
  };
}

export const getAllReplies = async () => {
  const query = 'SELECT * FROM replies';
  return await selectSQL(query);
};

export const getRecentReplies = async (blogId: number, limit: number = 5): Promise<Reply[]> => {
  const query = `
    SELECT r.*, 
           u.nickname, u.profile_image,
           c.sequence as content_sequence
    FROM replies r
    JOIN contents c ON r.content_id = c.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE c.blog_id = ?
    ORDER BY r.created_at DESC
    LIMIT ?
  `;
  
  const replies = await selectSQL<any>(query, [blogId, limit]);
  
  return replies.map((reply: any) => ({
    ...reply,
    user: {
      nickname: reply.nickname,
      profile_image: reply.profile_image
    },
    content: {
      sequence: reply.content_sequence
    }
  }));
};

export const getRepliesByContentId = async (contentId: number): Promise<Reply[]> => {
  const query = `
    SELECT r.*, 
           u.nickname, u.profile_image,
           c.sequence as content_sequence
    FROM replies r
    JOIN contents c ON r.content_id = c.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.content_id = ?
    ORDER BY r.created_at ASC
  `;
  
  const replies = await selectSQL<any>(query, [contentId]);
  
  return replies.map((reply: any) => ({
    ...reply,
    user: {
      nickname: reply.nickname,
      profile_image: reply.profile_image
    },
    content: {
      sequence: reply.content_sequence
    }
  }));
}; 