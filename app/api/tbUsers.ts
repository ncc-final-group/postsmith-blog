import { selectSQL } from '../_lib/mysql/db';

export const getAllUsers = async () => {
  const query = 'SELECT * FROM users';
  return await selectSQL(query);
};
