'use client';

import { useEffect, useState } from 'react';

import BlogLayout from './BlogLayout';
import { useBlogStore } from '../app/store/blogStore';
import { renderTemplate } from '../lib/template/TemplateEngine';

interface BlogThemeLoaderProps {
  blogId: number;
  templateData: any;
  fallbackHtml?: string;
  fallbackCss?: string;
}

export default function BlogThemeLoader({ blogId, templateData, fallbackHtml = '', fallbackCss = '' }: BlogThemeLoaderProps) {
  const { currentTheme, fetchCurrentTheme, isLoading } = useBlogStore();
  const [renderedHtml, setRenderedHtml] = useState(fallbackHtml);
  const [renderedCss, setRenderedCss] = useState(fallbackCss);

  useEffect(() => {
    // BlogStore에 저장된 블로그 ID로 테마 가져오기
    if (blogId) {
      fetchCurrentTheme(blogId);
    }
  }, [blogId, fetchCurrentTheme]);

  useEffect(() => {
    // 테마가 로드되면 템플릿 렌더링
    if (currentTheme?.themeHtml && currentTheme?.themeCss) {
      const html = renderTemplate(currentTheme.themeHtml, currentTheme.themeCss, templateData);
      setRenderedHtml(html);
      setRenderedCss(currentTheme.themeCss);
    }
  }, [currentTheme, templateData]);

  // 로딩 중이거나 테마가 없을 때 fallback 사용
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">테마를 불러오는 중...</div>
      </div>
    );
  }

  return <BlogLayout blogId={blogId} html={renderedHtml} css={renderedCss} />;
}
