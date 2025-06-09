import { selectSQL } from '../_lib/mysql/db';

export const getAllContentViews = async () => {
  const query = 'SELECT * FROM content_views';
  return await selectSQL(query);
}; 