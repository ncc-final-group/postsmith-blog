import { selectSQL } from '../_lib/mysql/db';

export const getAllBlogs = async () => {
  const query = 'SELECT * FROM blogs';
  return await selectSQL(query);
};

export const getBlogByAddress = async (address: string) => {
  const query = 'SELECT * FROM blogs WHERE address = ?';
  const result = await selectSQL(query, [address]);
  return result.length > 0 ? result[0] : null;
};
