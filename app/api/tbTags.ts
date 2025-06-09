import { selectSQL } from '../_lib/mysql/db';

export const getAllTags = async () => {
  const query = 'SELECT * FROM tags';
  return await selectSQL(query);
}; 