import { selectSQL } from '../_lib/mysql/db';

export const getAllBlogThemes = async () => {
  const query = 'SELECT * FROM blog_themes';
  return await selectSQL(query);
};