import { selectSQL } from '../_lib/mysql/db';

export const getAllContentVisits = async () => {
  const query = 'SELECT * FROM content_visits';
  return await selectSQL(query);
};
