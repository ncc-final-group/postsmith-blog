import { selectSQL } from '../_lib/mysql/db';

export const getAllContentTags = async () => {
  const query = 'SELECT * FROM content_tags';
  return await selectSQL(query);
};
