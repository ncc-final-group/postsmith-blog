import { selectSQL } from '../_lib/mysql/db';

export const getAllBlogPlugins = async () => {
  const query = 'SELECT * FROM blog_plugins';
  return await selectSQL(query);
};