'use client';

import { useBlogStore } from '../store/blogStore';
import { useEffect } from 'react';

interface BlogLayoutProps {
  blogId: number;
  html: string;
  css: string;
}

export default function BlogLayout({ blogId, html, css }: BlogLayoutProps) {
  const setBlogId = useBlogStore((state) => state.setBlogId);

  useEffect(() => {
    setBlogId(blogId);
  }, [blogId, setBlogId]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
} 