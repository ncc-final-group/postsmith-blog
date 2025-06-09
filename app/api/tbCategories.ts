import { selectSQL } from '../_lib/mysql/db';

export const getAllCategories = async () => {
  const query = 'SELECT * FROM categories';
  return await selectSQL(query);
};

export const getCategoriesByBlogId = async (blogId: number) => {
  const query = 'SELECT * FROM categories WHERE blog_id = ?';
  return await selectSQL(query, [blogId]);
};