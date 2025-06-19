export interface Blog {
  id: number;
  user_id: number;
  name: string;
  address: string;
  description: string;
  logo_image?: string;
  created_at: string;
  updated_at: string;
}

export interface Content {
  id: number;
  blog_id: number;
  category_id?: number;
  type: string;
  title: string;
  content_html: string;
  content_plain: string;
  is_temp: boolean;
  is_public: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  categoryId?: number; // snake_case -> camelCase 변경 및 옵셔널
  sequence: number;
  postCount?: number; // snake_case -> camelCase, 옵셔널
  blogId: number; // snake_case -> camelCase
  children?: Category[];
}
