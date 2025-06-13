import { selectSQL } from '../_lib/mysql/db';

export const getAllNotifications = async () => {
  const query = 'SELECT * FROM notifications';
  return await selectSQL(query);
};
