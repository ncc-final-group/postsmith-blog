import { selectSQL } from '../_lib/mysql/db';

export const getAllReplies = async () => {
  const query = 'SELECT * FROM replies';
  return await selectSQL(query);
}; 