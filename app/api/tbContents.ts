import { selectSQL } from '../_lib/mysql/db';

export interface Content {
  id: number;
  blog_id: number;
  category_id?: number;
  sequence: number;
  type: 'POSTS' | 'PAGE' | 'NOTICE';
  title: string;
  content_html: string;
  content_plain: string;
  is_temp: boolean;
  is_public: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    sequence: number;
    description?: string;
  };
  reply_count?: number;
  thumbnail?: string;
}

export const getAllContents = async () => {
  const query = 'SELECT * FROM contents';
  return await selectSQL(query);
};

export const getContentByBlogIdAndSequence = async (blogId: number, contentSequence: number): Promise<Content | null> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.sequence = ?
    GROUP BY c.id
  `;

  const contents = await selectSQL<any>(query, [blogId, contentSequence]);

  if (contents.length === 0) {
    return null;
  }

  const content = contents[0];
  return {
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  };
};

export const getContentsByBlogId = async (blogId: number): Promise<Content[]> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ?
    GROUP BY c.id
    ORDER BY c.sequence DESC
  `;

  const contents = await selectSQL<any>(query, [blogId]);

  return contents.map((content: any) => ({
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  }));
};

export const getRecentContents = async (blogId: number, limit: number = 5): Promise<Content[]> => {
  const query = `
    SELECT 
      c.*,
      cat.id as category_id,
      cat.name as category_name,
      cat.sequence as category_sequence,
      cat.description as category_description,
      (SELECT COUNT(*) FROM replies r WHERE r.content_id = c.id AND r.deleted_at IS NULL) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.blog_id = ? AND c.is_public = 1 AND c.is_temp = 0
    ORDER BY c.created_at DESC
    LIMIT ?
  `;
  const rows = await selectSQL<any>(query, [blogId, limit]);

  return rows.map((row) => ({
    ...row,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          sequence: row.category_sequence,
          description: row.category_description,
        }
      : undefined,
  }));
};

export const getContentById = async (id: number): Promise<Content | null> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.id = ?
    GROUP BY c.id
  `;

  const contents = await selectSQL<any>(query, [id]);

  if (contents.length === 0) {
    return null;
  }

  const content = contents[0];
  return {
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  };
};

export const getContentBySequence = async (blogId: number, sequence: number): Promise<Content | null> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.sequence = ?
    GROUP BY c.id
  `;

  const contents = await selectSQL<any>(query, [blogId, sequence]);

  if (contents.length === 0) {
    return null;
  }

  const content = contents[0];
  return {
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  };
};

// 이전 글 가져오기 (현재 sequence보다 작은 것 중 가장 큰 sequence)
export const getPrevContent = async (blogId: number, currentSequence: number): Promise<{ sequence: number; title: string } | null> => {
  const query = `
    SELECT sequence, title
    FROM contents
    WHERE blog_id = ? AND sequence < ? AND is_public = 1 AND is_temp = 0
    ORDER BY sequence DESC
    LIMIT 1
  `;

  const contents = await selectSQL<any>(query, [blogId, currentSequence]);

  if (contents.length === 0) {
    return null;
  }

  return contents[0];
};

// 다음 글 가져오기 (현재 sequence보다 큰 것 중 가장 작은 sequence)
export const getNextContent = async (blogId: number, currentSequence: number): Promise<{ sequence: number; title: string } | null> => {
  const query = `
    SELECT sequence, title
    FROM contents
    WHERE blog_id = ? AND sequence > ? AND is_public = 1 AND is_temp = 0
    ORDER BY sequence ASC
    LIMIT 1
  `;

  const contents = await selectSQL<any>(query, [blogId, currentSequence]);

  if (contents.length === 0) {
    return null;
  }

  return contents[0];
};
