import { selectSQL } from '../_lib/mysql/db';

export const getAllThemeTags = async () => {
  const query = 'SELECT * FROM theme_tags';
  return await selectSQL(query);
};
