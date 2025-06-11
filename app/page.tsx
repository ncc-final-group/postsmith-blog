import { Metadata } from 'next';
import { headers } from 'next/headers';
import React from 'react';
import { getBlogByAddress } from './api/tbBlogs';
import { getActiveThemeByBlogId } from './api/tbThemes';
import { getCategoriesByBlogId } from './api/tbCategories';
import { getContentsByBlogId } from './api/tbContents';
import { getRecentReplies } from './api/tbReplies';
import { TemplateEngine } from '../lib/template/TemplateEngine';
import BlogLayout from './components/BlogLayout';

// 날짜를 ISO 문자열로 변환하는 유틸리티 함수
function formatDateToISO(date: Date): string {
  return date.toISOString();
}

// 첫 번째 테마(id=1)를 불러와 SSR 로 렌더링합니다.
// 필요하다면 요청 도메인/쿼리로 theme id 를 결정하도록 수정하세요.

export async function generateMetadata(): Promise<Metadata> {
  // 요청 호스트에서 블로그 주소 추출
  const headerList = await headers();
  const host = headerList.get('host') || '';
  const hostNoPort = host.split(':')[0];
  let address = '';
  if (hostNoPort.includes('localhost')) {
    const parts = hostNoPort.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      address = parts[0];
    }
  } else {
    const parts = hostNoPort.split('.');
    if (parts.length > 0) {
      address = parts[0];
    }
  }

  // 블로그 정보 조회
  const blog = await getBlogByAddress(address);

  return {
    title: blog?.name || address,
    description: blog?.description,
    viewport: 'width=device-width, initial-scale=1',
  };
}

export default async function HomePage() {
  // URL에서 subdomain 추출
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const subdomain = host.split('.')[0];

  // 블로그 정보 조회
  const blog = await getBlogByAddress(subdomain);
  if (!blog) {
    return new Response('Blog not found', { status: 404 });
  }

  // 테마 정보 조회
  const theme = await getActiveThemeByBlogId(blog.id);
  if (!theme) {
    return new Response('Theme not found', { status: 404 });
  }

  // 컨텐츠 목록 조회
  const contents = await getContentsByBlogId(blog.id);

  // 최근 댓글 조회
  const recentReplies = await getRecentReplies(blog.id, 5);

  // 카테고리 목록 조회
  const categories = await getCategoriesByBlogId(blog.id);

  // 템플릿 데이터 준비
  const templateData = {
    blog: {
      title: blog.title,
      description: blog.description,
      profile_image: blog.profile_image,
      address: blog.address
    },
    categories,
    contents,
    recentReplies
  };

  // 템플릿 렌더링
  const renderedHtml = TemplateEngine.render(theme.html, theme.css, templateData);

  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: theme.css }} />
      </head>
      <body>
        <BlogLayout 
          blogId={blog.id} 
          html={renderedHtml} 
          css={theme.css} 
        />
      </body>
    </html>
  );
}
