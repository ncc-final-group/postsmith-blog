'use client';

import { useEffect, useRef, useState } from 'react';

import { useBlogStore } from '../app/store/blogStore';
import { renderTemplate } from '../lib/template/TemplateEngine';

interface BlogRendererProps {
  blogId: number;
  templateData: any;
}

export default function BlogRenderer({ blogId, templateData }: BlogRendererProps) {
  const { currentTheme, fetchCurrentTheme, isLoading } = useBlogStore();
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [renderedCss, setRenderedCss] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptsExecuted, setScriptsExecuted] = useState<boolean>(false);

  useEffect(() => {
    // BlogStore에 저장된 블로그 ID로 테마 가져오기
    if (blogId) {
      fetchCurrentTheme(blogId);
    }
  }, [blogId, fetchCurrentTheme]);

  // 템플릿 엔진을 사용하여 처리
  const processTemplate = (html: string, css: string, data: any) => {
    // 템플릿 엔진을 사용하여 처리
    return renderTemplate(html, css, data);
  };

  useEffect(() => {
    // 테마가 로드되면 템플릿 렌더링
    if (currentTheme?.themeHtml && currentTheme?.themeCss) {
      const html = processTemplate(currentTheme.themeHtml, currentTheme.themeCss, templateData);
      setRenderedContent(html);
      setRenderedCss(currentTheme.themeCss);

      // 렌더링 후 스크립트 실행 (중복 실행 방지)
      if (!scriptsExecuted) {
        setTimeout(() => {
          // 스크립트 수동 실행
          const root = containerRef.current;
          if (root) {
            const scripts = root.querySelectorAll<HTMLScriptElement>('script');

            scripts.forEach((oldScript, index) => {
              const newScript = document.createElement('script');
              // copy attributes
              Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
              });
              // copy inline code
              if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
              }
              // replace old with new to execute
              oldScript.parentNode?.replaceChild(newScript, oldScript);
            });

            // DOMContentLoaded 이벤트 발생
            if (document.readyState !== 'loading') {
              document.dispatchEvent(new Event('DOMContentLoaded'));
            }

            setScriptsExecuted(true);
          }
        }, 1000);
      }
    }
  }, [currentTheme, templateData]);

  // 로딩 중이거나 테마가 없을 때
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">테마를 불러오는 중...</div>
      </div>
    );
  }

  if (!renderedContent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">블로그를 준비 중...</div>
      </div>
    );
  }

  return (
    <>
      <style>{renderedCss}</style>
      <div ref={containerRef} className="blog-container" dangerouslySetInnerHTML={{ __html: renderedContent }} suppressHydrationWarning />
    </>
  );
}
