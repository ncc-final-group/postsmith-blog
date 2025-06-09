import { selectSQL } from '../_lib/mysql/db';

export const getAllContents = async () => {
  const query = 'SELECT * FROM contents';
  return await selectSQL(query);
};

export const getContentByBlogIdAndSequence = async (blogId: number, contentSequence: number) => {
  const query = 'SELECT * FROM contents WHERE blog_id = ? AND sequence = ?';
  return await selectSQL(query, [blogId, contentSequence]);
};

export const getContentsByBlogId = async (blogId: number) => {
  const query = 'SELECT * FROM contents WHERE blog_id = ? ORDER BY content_sequence DESC';
  return await selectSQL(query, [blogId]);
}; 