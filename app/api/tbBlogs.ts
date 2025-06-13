import { selectSQL } from '../_lib/mysql/db';

export interface Blog {
  id: number;
  user_id: number;
  address: string;
  nickname: string;
  description: string | null;
  logo_image: string | null;
  created_at: string;
  updated_at: string;
}

export const getAllBlogs = async () => {
  const query = 'SELECT * FROM blogs';
  return await selectSQL(query);
};

export const getBlogByAddress = async (address: string): Promise<Blog | null> => {
  const query = `
    SELECT *
    FROM blogs
    WHERE address = ?
    LIMIT 1
  `;

  const blogs = await selectSQL<Blog>(query, [address]);
  return blogs.length > 0 ? blogs[0] : null;
};

export const getBlogById = async (id: number): Promise<Blog | null> => {
  const query = `
    SELECT *
    FROM blogs
    WHERE id = ?
    LIMIT 1
  `;

  const blogs = await selectSQL<Blog>(query, [id]);
  return blogs.length > 0 ? blogs[0] : null;
};

// 블로그 작성자 정보 포함해서 가져오기
export const getBlogWithAuthor = async (address: string): Promise<(Blog & { author?: string }) | null> => {
  const query = `
    SELECT b.*, u.nickname as author
    FROM blogs b
    LEFT JOIN users u ON b.user_id = u.id
    WHERE b.address = ?
    LIMIT 1
  `;

  const blogs = await selectSQL<any>(query, [address]);
  return blogs.length > 0 ? blogs[0] : null;
};
