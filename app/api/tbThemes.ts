import { selectSQL } from '../_lib/mysql/db';

export const getAllThemes = async () => {
  const query = 'SELECT * FROM themes';
  return await selectSQL(query);
}; 