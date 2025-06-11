import { selectSQL } from '../_lib/mysql/db';

export interface Blog {
  id: number;
  user_id: number;
  address: string;
  title: string;
  description: string | null;
  profile_image: string | null;
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
