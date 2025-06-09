import { selectSQL } from '../_lib/mysql/db';

export const getAllUploads = async () => {
  const query = 'SELECT * FROM uploads';
  return await selectSQL(query);
}; 