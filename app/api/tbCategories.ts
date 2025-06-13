import { selectSQL } from '../_lib/mysql/db';

export interface Category {
  id: number;
  blog_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  sort_order: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export const getAllCategories = async () => {
  const query = 'SELECT * FROM categories';
  return await selectSQL(query);
};

export const getCategoriesByBlogId = async (blogId: number): Promise<Category[]> => {
  const query = `
    SELECT c.*, 
           COUNT(DISTINCT co.id) as post_count
    FROM categories c
    LEFT JOIN contents co ON c.id = co.category_id AND co.is_temp = 0 AND co.is_public = 1
    WHERE c.blog_id = ?
    GROUP BY c.id
    ORDER BY c.id ASC
  `;

  return await selectSQL<Category>(query, [blogId]);
};
