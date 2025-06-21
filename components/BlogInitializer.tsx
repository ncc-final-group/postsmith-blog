'use client';

import { useEffect } from 'react';

import { useBlogStore } from '../app/store/blogStore';

export default function BlogInitializer() {
  const { setBlogInfo, clearBlog } = useBlogStore();

  useEffect(() => {
    // 쿠키에서 블로그 정보 읽기
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const blogInfoCookie = getCookie('blog-info');

    if (blogInfoCookie) {
      try {
        const blogInfo = JSON.parse(decodeURIComponent(blogInfoCookie));
        setBlogInfo(blogInfo);
      } catch (error) {
        // JSON 파싱 에러 시에만 클리어
        clearBlog();
      }
    }
    // ❌ 쿠키가 없다고 해서 스토어를 클리어하지 않음
    // localStorage의 persist 데이터가 우선되도록 함
  }, [setBlogInfo, clearBlog]);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않음
}
