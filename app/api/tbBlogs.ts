import { selectSQL } from '../_lib/mysql/db';

export const getAllBlogs = async () => {
  const query = 'SELECT * FROM blogs';
  return await selectSQL(query);
};