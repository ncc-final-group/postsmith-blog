import { selectSQL } from '../_lib/mysql/db';

export const getAllPlugins = async () => {
  const query = 'SELECT * FROM plugins';
  return await selectSQL(query);
};
