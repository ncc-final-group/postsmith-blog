'use client';

import { useEffect, useRef, useState } from 'react';

import EditorContentHandler from './EditorContentHandler';
import { useBlogStore } from '../app/store/blogStore';

interface BlogLayoutProps {
  blogId: number;
  html: string;
  css: string;
}

export default function BlogLayout({ blogId, html, css }: BlogLayoutProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const setBlogId = useBlogStore((state) => state.setBlogId);

  useEffect(() => {
    setMounted(true);
    setBlogId(blogId);
  }, [blogId, setBlogId]);

  useEffect(() => {
    if (!mounted) return;
    const root = containerRef.current;
    if (!root) return;

    const scripts = root.querySelectorAll<HTMLScriptElement>('script');
    scripts.forEach((oldScript) => {
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

    // 일부 스킨 스크립트는 DOMContentLoaded 이벤트를 기다리는데, 이미 페이지가 로드된 뒤
    // 주입되기 때문에 한 번 수동으로 이벤트를 발생시켜준다.
    if (document.readyState !== 'loading') {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
  }, [html, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      <style>{css}</style>
      <EditorContentHandler />
      <div className="blog-content-inner" ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
    </>
  );
}
