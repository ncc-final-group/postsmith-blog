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
  description: string;
  category_id?: number;
  type: string;
  sort_order: number;
  post_count: number;
  user_id: number;
}
