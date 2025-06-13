import { selectSQL } from '../_lib/mysql/db';

export const getAllSubscription = async () => {
  const query = 'SELECT * FROM subscription';
  return await selectSQL(query);
};
