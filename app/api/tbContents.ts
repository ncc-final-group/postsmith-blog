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

export const getContentsByBlogId = async (blogId: number, userId?: number): Promise<Content[]> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? ${publicCondition} AND c.is_temp = 0
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

// POSTS 타입만 가져오는 함수 (페이징 없음)
export const getPostsByBlogId = async (blogId: number, userId?: number): Promise<Content[]> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
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

export const getRecentContents = async (blogId: number, limit: number = 5, userId?: number): Promise<Content[]> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

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
    WHERE c.blog_id = ? ${publicCondition} AND c.is_temp = 0
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

// POSTS 타입만 가져오는 함수 (일반 블로그 글용)
export const getPostBySequence = async (blogId: number, sequence: number, userId?: number): Promise<Content | null> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.sequence = ? AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
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

// POSTS 타입 이전 글 가져오기
export const getPrevPost = async (blogId: number, currentSequence: number, userId?: number): Promise<{ sequence: number; title: string } | null> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND is_public = 1';

  const query = `
    SELECT sequence, title
    FROM contents
    WHERE blog_id = ? AND sequence < ? AND type = 'POSTS' ${publicCondition} AND is_temp = 0
    ORDER BY sequence DESC
    LIMIT 1
  `;

  const contents = await selectSQL<any>(query, [blogId, currentSequence]);

  if (contents.length === 0) {
    return null;
  }

  return contents[0];
};

// POSTS 타입 다음 글 가져오기
export const getNextPost = async (blogId: number, currentSequence: number, userId?: number): Promise<{ sequence: number; title: string } | null> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND is_public = 1';

  const query = `
    SELECT sequence, title
    FROM contents
    WHERE blog_id = ? AND sequence > ? AND type = 'POSTS' ${publicCondition} AND is_temp = 0
    ORDER BY sequence ASC
    LIMIT 1
  `;

  const contents = await selectSQL<any>(query, [blogId, currentSequence]);

  if (contents.length === 0) {
    return null;
  }

  return contents[0];
};

// 인기글 데이터 인터페이스
export interface PopularContent {
  content_id: number;
  sequence: number;
  title: string;
  content_html: string;
  recent_reply_count: number;
  recent_visit_count: number;
  popularity_score: number;
}

// 최근 한 달간 댓글 수와 방문자 수 기준 인기글 가져오기
export const getPopularContentsByBlogId = async (blogId: number, userId?: number): Promise<PopularContent[]> => {
  const query = `
    SELECT 
      c.id as content_id,
      c.sequence,
      c.title,
      SUBSTRING(c.content_html, 1, 1000) as content_html,
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
    WHERE c.blog_id = ? ${userId !== undefined ? '' : 'AND c.is_public = 1'}
    ORDER BY popularity_score DESC, c.created_at DESC
    LIMIT 20
  `;

  return await selectSQL<PopularContent>(query, [blogId]);
};

// 관리자용 최근 콘텐츠 조회 (is_public 상관없이 모든 콘텐츠)
export const getRecentContentsForAdmin = async (blogId: number, limit: number = 20): Promise<Content[]> => {
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
    WHERE c.blog_id = ? AND c.is_temp = 0
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

// 관리자용 인기 콘텐츠 조회 (is_public 상관없이 모든 콘텐츠)
export const getPopularContentsByBlogIdForAdmin = async (blogId: number): Promise<PopularContent[]> => {
  const query = `
    SELECT 
      c.id as content_id,
      c.sequence,
      c.title,
      SUBSTRING(c.content_html, 1, 1000) as content_html,
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
    WHERE c.blog_id = ? AND c.is_temp = 0
    ORDER BY popularity_score DESC, c.created_at DESC
    LIMIT 20
  `;

  return await selectSQL<PopularContent>(query, [blogId]);
};

// 페이징 결과 인터페이스
export interface PaginatedContents {
  contents: Content[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalContents: number;
    hasNext: boolean;
    hasPrev: boolean;
    pageSize: number;
  };
}

// 페이징을 지원하는 블로그별 콘텐츠 조회
export const getContentsByBlogIdWithPaging = async (blogId: number, page: number = 1, pageSize: number = 10): Promise<PaginatedContents> => {
  const offset = (page - 1) * pageSize;

  // 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM contents c
    WHERE c.blog_id = ? AND c.is_public = 1 AND c.is_temp = 0
  `;
  const countResult = await selectSQL<any>(countQuery, [blogId]);
  const totalContents = countResult[0].total;
  const totalPages = Math.ceil(totalContents / pageSize);

  // 페이징된 콘텐츠 조회
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.is_public = 1 AND c.is_temp = 0
    GROUP BY c.id
    ORDER BY c.sequence DESC
    LIMIT ? OFFSET ?
  `;

  const contents = await selectSQL<any>(query, [blogId, pageSize, offset]);

  const mappedContents = contents.map((content: any) => ({
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  }));

  return {
    contents: mappedContents,
    pagination: {
      currentPage: page,
      totalPages,
      totalContents,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize,
    },
  };
};

// POSTS 타입만 페이징하여 조회하는 함수
export const getPostsByBlogIdWithPaging = async (blogId: number, page: number = 1, pageSize: number = 10, userId?: number): Promise<PaginatedContents> => {
  const offset = (page - 1) * pageSize;

  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  // POSTS 타입 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM contents c
    WHERE c.blog_id = ? AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
  `;
  const countResult = await selectSQL<any>(countQuery, [blogId]);
  const totalContents = countResult[0].total;
  const totalPages = Math.ceil(totalContents / pageSize);

  // 페이징된 POSTS 타입 콘텐츠 조회
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
    GROUP BY c.id
    ORDER BY c.sequence DESC
    LIMIT ? OFFSET ?
  `;

  const contents = await selectSQL<any>(query, [blogId, pageSize, offset]);

  const mappedContents = contents.map((content: any) => ({
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  }));

  return {
    contents: mappedContents,
    pagination: {
      currentPage: page,
      totalPages,
      totalContents,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize,
    },
  };
};

// 카테고리별 페이징 콘텐츠 조회
export const getContentsByCategoryWithPaging = async (blogId: number, categoryId: number, page: number = 1, pageSize: number = 10, userId?: number): Promise<PaginatedContents> => {
  const offset = (page - 1) * pageSize;

  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  // 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM contents c
    WHERE c.blog_id = ? AND c.category_id = ? ${publicCondition} AND c.is_temp = 0
  `;
  const countResult = await selectSQL<any>(countQuery, [blogId, categoryId]);
  const totalContents = countResult[0].total;
  const totalPages = Math.ceil(totalContents / pageSize);

  // 페이징된 콘텐츠 조회
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.category_id = ? ${publicCondition} AND c.is_temp = 0
    GROUP BY c.id
    ORDER BY c.sequence DESC
    LIMIT ? OFFSET ?
  `;

  const contents = await selectSQL<any>(query, [blogId, categoryId, pageSize, offset]);

  const mappedContents = contents.map((content: any) => ({
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  }));

  return {
    contents: mappedContents,
    pagination: {
      currentPage: page,
      totalPages,
      totalContents,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize,
    },
  };
};

// 카테고리 이름으로 페이징 콘텐츠 조회
export const getContentsByCategoryNameWithPaging = async (
  blogId: number,
  categoryName: string,
  page: number = 1,
  pageSize: number = 10,
  userId?: number,
): Promise<PaginatedContents> => {
  const offset = (page - 1) * pageSize;

  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  // 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.blog_id = ? AND cat.name = ? ${publicCondition} AND c.is_temp = 0
  `;
  const countResult = await selectSQL<any>(countQuery, [blogId, categoryName]);
  const totalContents = countResult[0].total;
  const totalPages = Math.ceil(totalContents / pageSize);

  // 페이징된 콘텐츠 조회
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND cat.name = ? ${publicCondition} AND c.is_temp = 0
    GROUP BY c.id
    ORDER BY c.sequence DESC
    LIMIT ? OFFSET ?
  `;

  const contents = await selectSQL<any>(query, [blogId, categoryName, pageSize, offset]);

  const mappedContents = contents.map((content: any) => ({
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  }));

  return {
    contents: mappedContents,
    pagination: {
      currentPage: page,
      totalPages,
      totalContents,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize,
    },
  };
};

// NOTICE 타입 글 페이징 조회
export const getNoticesByBlogIdWithPaging = async (blogId: number, page: number = 1, pageSize: number = 10): Promise<PaginatedContents> => {
  const offset = (page - 1) * pageSize;

  // 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM contents c
    WHERE c.blog_id = ? AND c.type = 'NOTICE' AND c.is_public = 1 AND c.is_temp = 0
  `;
  const countResult = await selectSQL<any>(countQuery, [blogId]);
  const totalContents = countResult[0].total;
  const totalPages = Math.ceil(totalContents / pageSize);

  // 페이징된 공지사항 조회
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'NOTICE' AND c.is_public = 1 AND c.is_temp = 0
    GROUP BY c.id
    ORDER BY c.sequence DESC
    LIMIT ? OFFSET ?
  `;

  const contents = await selectSQL<any>(query, [blogId, pageSize, offset]);

  const mappedContents = contents.map((content: any) => ({
    ...content,
    category: content.category_id
      ? {
          id: content.category_id,
          name: content.category_name,
        }
      : undefined,
  }));

  return {
    contents: mappedContents,
    pagination: {
      currentPage: page,
      totalPages,
      totalContents,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize,
    },
  };
};

// 전체 NOTICE 타입 글 조회 (페이징 없음)
export const getNoticesByBlogId = async (blogId: number): Promise<Content[]> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'NOTICE' AND c.is_public = 1 AND c.is_temp = 0
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

// NOTICE 타입 글을 title로 조회
export const getNoticeByTitle = async (blogId: number, title: string): Promise<Content | null> => {
  // 먼저 정확한 제목으로 조회
  let query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'NOTICE' AND c.is_public = 1 AND c.is_temp = 0
    AND c.title = ?
    GROUP BY c.id
    LIMIT 1
  `;

  let contents = await selectSQL<any>(query, [blogId, title]);

  // 정확한 제목으로 찾지 못한 경우, 정규화된 제목으로 검색
  if (contents.length === 0) {
    const normalizedTitle = title.replace(/\s+/g, ' ').trim();

    query = `
      SELECT c.*, 
             cat.id as category_id, 
             cat.name as category_name,
             COUNT(DISTINCT r.id) as reply_count
      FROM contents c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN replies r ON c.id = r.content_id
      WHERE c.blog_id = ? AND c.type = 'NOTICE' AND c.is_public = 1 AND c.is_temp = 0
      AND TRIM(REPLACE(c.title, CHAR(9), ' ')) = ?
      GROUP BY c.id
      LIMIT 1
    `;

    contents = await selectSQL<any>(query, [blogId, normalizedTitle]);
  }

  // 여전히 찾지 못한 경우, LIKE 검색 사용
  if (contents.length === 0) {
    query = `
      SELECT c.*, 
             cat.id as category_id, 
             cat.name as category_name,
             COUNT(DISTINCT r.id) as reply_count
      FROM contents c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN replies r ON c.id = r.content_id
      WHERE c.blog_id = ? AND c.type = 'NOTICE' AND c.is_public = 1 AND c.is_temp = 0
      AND c.title LIKE ?
      GROUP BY c.id
      LIMIT 1
    `;

    contents = await selectSQL<any>(query, [blogId, `%${title}%`]);
  }

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

// PAGE 타입 글을 pageName으로 조회 (slug 또는 title 기반)
export const getPageByName = async (blogId: number, pageName: string): Promise<Content | null> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'PAGE' AND c.is_public = 1 AND c.is_temp = 0
    AND (c.slug = ? OR c.title = ?)
    GROUP BY c.id
    LIMIT 1
  `;

  const contents = await selectSQL<any>(query, [blogId, pageName, pageName]);

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

// PAGE 타입 글을 title로만 조회
export const getPageByTitle = async (blogId: number, title: string): Promise<Content | null> => {
  // 먼저 정확한 제목으로 조회
  let query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'PAGE' AND c.is_public = 1 AND c.is_temp = 0
    AND c.title = ?
    GROUP BY c.id
    LIMIT 1
  `;

  let contents = await selectSQL<any>(query, [blogId, title]);

  // 정확한 제목으로 찾지 못한 경우, 정규화된 제목으로 검색
  if (contents.length === 0) {
    // 공백 정규화 후 재검색
    const normalizedTitle = title.replace(/\s+/g, ' ').trim();

    query = `
      SELECT c.*, 
             cat.id as category_id, 
             cat.name as category_name,
             COUNT(DISTINCT r.id) as reply_count
      FROM contents c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN replies r ON c.id = r.content_id
      WHERE c.blog_id = ? AND c.type = 'PAGE' AND c.is_public = 1 AND c.is_temp = 0
      AND TRIM(REPLACE(c.title, CHAR(9), ' ')) = ?
      GROUP BY c.id
      LIMIT 1
    `;

    contents = await selectSQL<any>(query, [blogId, normalizedTitle]);
  }

  // 여전히 찾지 못한 경우, LIKE 검색 사용 (정확한 일치는 아니지만 유사한 제목 찾기)
  if (contents.length === 0) {
    query = `
      SELECT c.*, 
             cat.id as category_id, 
             cat.name as category_name,
             COUNT(DISTINCT r.id) as reply_count
      FROM contents c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN replies r ON c.id = r.content_id
      WHERE c.blog_id = ? AND c.type = 'PAGE' AND c.is_public = 1 AND c.is_temp = 0
      AND c.title LIKE ?
      GROUP BY c.id
      LIMIT 1
    `;

    contents = await selectSQL<any>(query, [blogId, `%${title}%`]);
  }

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

// 전체 PAGE 타입 글 조회
export const getPagesByBlogId = async (blogId: number): Promise<Content[]> => {
  const query = `
    SELECT c.*, 
           cat.id as category_id, 
           cat.name as category_name,
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.type = 'PAGE' AND c.is_public = 1 AND c.is_temp = 0
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

// 카테고리가 없는 글들을 페이징으로 조회
export const getUncategorizedContentsByBlogIdWithPaging = async (blogId: number, page: number = 1, pageSize: number = 10, userId?: number): Promise<PaginatedContents> => {
  const offset = (page - 1) * pageSize;

  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  // 분류 없는 POSTS 타입 글 전체 개수 조회
  const countQuery = `
    SELECT COUNT(*) as total
    FROM contents c
    WHERE c.blog_id = ? AND c.category_id IS NULL AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
  `;
  const countResult = await selectSQL<any>(countQuery, [blogId]);
  const totalContents = countResult[0].total;
  const totalPages = Math.ceil(totalContents / pageSize);

  // 페이징된 분류 없는 POSTS 타입 글 조회
  const query = `
    SELECT c.*, 
           COUNT(DISTINCT r.id) as reply_count
    FROM contents c
    LEFT JOIN replies r ON c.id = r.content_id
    WHERE c.blog_id = ? AND c.category_id IS NULL AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
    GROUP BY c.id
    ORDER BY c.sequence DESC
    LIMIT ? OFFSET ?
  `;

  const contents = await selectSQL<any>(query, [blogId, pageSize, offset]);

  const mappedContents = contents.map((content: any) => ({
    ...content,
    category: undefined, // 카테고리가 없으므로 undefined
  }));

  return {
    contents: mappedContents,
    pagination: {
      currentPage: page,
      totalPages,
      totalContents,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      pageSize,
    },
  };
};

// 카테고리가 없는 글 개수 조회
export const getUncategorizedCountByBlogId = async (blogId: number, userId?: number): Promise<number> => {
  // 블로그 소유자인지 확인하여 조건 설정
  const isOwner = userId !== undefined;
  const publicCondition = isOwner ? '' : 'AND c.is_public = 1';

  const query = `
    SELECT COUNT(*) as count
    FROM contents c
    WHERE c.blog_id = ? AND c.category_id IS NULL AND c.type = 'POSTS' ${publicCondition} AND c.is_temp = 0
  `;

  const result = await selectSQL<any>(query, [blogId]);
  return result[0].count;
};
