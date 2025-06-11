import { selectSQL } from '../_lib/mysql/db';

export interface Theme {
  id: number;
  name: string;
  html: string;
  css: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const getAllThemes = async () => {
  const query = 'SELECT * FROM themes';
  return await selectSQL(query);
};

export const getThemeById = async (id: number): Promise<Theme | null> => {
  const query = `
    SELECT *
    FROM themes
    WHERE id = ?
    LIMIT 1
  `;
  
  const themes = await selectSQL<Theme>(query, [id]);
  return themes.length > 0 ? themes[0] : null;
};

// 블로그 주소(blogs.address)로 활성화된 테마 가져오기
export const getThemeByBlogAddress = async (address: string): Promise<Theme | null> => {
  const query = `
    SELECT t.*
    FROM themes t
    JOIN blog_themes bt ON t.id = bt.theme_id
    JOIN blogs b ON bt.blog_id = b.id
    WHERE b.address = ?
    AND bt.is_active = true
    LIMIT 1
  `;
  
  const themes = await selectSQL<Theme>(query, [address]);
  return themes.length > 0 ? themes[0] : null;
};

export const getActiveThemeByBlogId = async (blogId: number): Promise<Theme | null> => {
  const query = `
    SELECT t.*
    FROM themes t
    JOIN blog_themes bt ON t.id = bt.theme_id
    WHERE bt.blog_id = ?
    AND bt.is_active = true
    LIMIT 1
  `;
  
  const themes = await selectSQL<Theme>(query, [blogId]);
  return themes.length > 0 ? themes[0] : null;
}; 