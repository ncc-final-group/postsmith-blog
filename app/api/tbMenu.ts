import { selectSQL } from '../_lib/mysql/db';

export interface Menu {
  id: number;
  blog_id: number;
  name: string;
  type: string;
  uri: string;
  is_blank: boolean;
}

// 특정 블로그의 모든 메뉴 조회
export async function getMenusByBlogId(blogId: number): Promise<Menu[]> {
  try {
    const query = `
      SELECT 
        id,
        blog_id,
        name,
        type,
        uri,
        is_blank
      FROM menu 
      WHERE blog_id = ?
      ORDER BY id ASC
    `;

    const rows = await selectSQL<Menu>(query, [blogId]);
    return rows.map((row) => ({
      id: Number(row.id),
      blog_id: Number(row.blog_id),
      name: String(row.name),
      type: String(row.type),
      uri: String(row.uri),
      is_blank: Boolean(row.is_blank),
    }));
  } catch (error) {
    return [];
  }
}

// 특정 메뉴 조회
export async function getMenuById(id: number): Promise<Menu | null> {
  try {
    const query = `
      SELECT 
        id,
        blog_id,
        name,
        type,
        uri,
        is_blank
      FROM menu 
      WHERE id = ?
    `;

    const rows = await selectSQL<Menu>(query, [id]);
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: Number(row.id),
      blog_id: Number(row.blog_id),
      name: String(row.name),
      type: String(row.type),
      uri: String(row.uri),
      is_blank: Boolean(row.is_blank),
    };
  } catch (error) {
    return null;
  }
}

// 특정 블로그의 메뉴 개수 조회
export async function getMenuCountByBlogId(blogId: number): Promise<number> {
  try {
    const query = 'SELECT COUNT(*) as count FROM menu WHERE blog_id = ?';
    const rows = await selectSQL<{ count: number }>(query, [blogId]);
    return Number(rows[0]?.count || 0);
  } catch (error) {
    return 0;
  }
}

// 메뉴 타입별 조회
export async function getMenusByType(blogId: number, type: string): Promise<Menu[]> {
  try {
    const query = `
      SELECT 
        id,
        blog_id,
        name,
        type,
        uri,
        is_blank
      FROM menu 
      WHERE blog_id = ? AND type = ?
      ORDER BY id ASC
    `;

    const rows = await selectSQL<Menu>(query, [blogId, type]);
    return rows.map((row) => ({
      id: Number(row.id),
      blog_id: Number(row.blog_id),
      name: String(row.name),
      type: String(row.type),
      uri: String(row.uri),
      is_blank: Boolean(row.is_blank),
    }));
  } catch (error) {
    return [];
  }
}
