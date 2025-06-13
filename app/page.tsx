import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import React from 'react';

import { getBlogByAddress } from './api/tbBlogs';
import { getCategoriesByBlogId } from './api/tbCategories';
import { getContentsByBlogId } from './api/tbContents';
import { getRecentReplies } from './api/tbReplies';
import { getActiveThemeByBlogId } from './api/tbThemes';
import BlogLayout from './components/BlogLayout';
import BlogProvider from './components/BlogProvider';
import { renderTemplate } from '../lib/template/TemplateEngine';

// 날짜를 ISO 문자열로 변환하는 유틸리티 함수
function formatDate(date: Date): string {
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
    title: blog?.nickname || address,
    description: blog?.description,
    viewport: 'width=device-width, initial-scale=1',
  };
}

async function getBlogAddress(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';

    // address.localhost:3000 형태에서 address 추출
    if (host.includes('.localhost')) {
      const subdomain = host.split('.localhost')[0];
      return subdomain;
    }

    // address.domain.com 형태에서 address 추출
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        return parts[0];
      }
    }

    // 기본값 (개발 환경)
    return 'testblog';
  } catch (error) {
    // 서버 환경에서 headers를 읽을 수 없는 경우 기본값 반환
    return 'testblog';
  }
}

export default async function HomePage() {
  try {
    const subdomain = await getBlogAddress();

    const blog = await getBlogByAddress(subdomain);
    if (!blog) {
      notFound();
    }

    const theme = await getActiveThemeByBlogId(blog.id);
    if (!theme) {
      notFound();
    }

    const categories = await getCategoriesByBlogId(blog.id);
    const contents = await getContentsByBlogId(blog.id);
    const recentReplies = await getRecentReplies(blog.id);

    const templateData = {
      blog: {
        nickname: String(blog.nickname),
        description: blog.description ? String(blog.description) : null,
        logo_image: blog.logo_image ? String(blog.logo_image) : null,
        address: String(blog.address),
        author: undefined, // 메인 페이지에서는 작성자 정보 불필요
      },
      categories: categories.map((category) => ({
        id: Number(category.id),
        name: String(category.name),
        post_count: Number(category.post_count),
        category_id: category.category_id == null ? null : Number(category.category_id),
      })),
      contents: contents.map((content) => ({
        sequence: Number(content.sequence),
        title: String(content.title),
        content_html: String(content.content_html),
        content_plain: String(content.content_plain),
        created_at: String(content.created_at),
        thumbnail: content.thumbnail ? String(content.thumbnail) : undefined,
        category: content.category
          ? {
              id: Number(content.category.id),
              name: String(content.category.name),
            }
          : undefined,
        reply_count: Number(content.reply_count ?? 0),
      })),
      recentReplies: recentReplies.map((reply) => ({
        id: Number(reply.id),
        content_id: Number(reply.content_id),
        content: String(reply.content),
        created_at: String(reply.created_at),
        content_sequence: Number(reply.content_sequence),
        user: { nickname: String(reply.user_nickname ?? '익명') },
      })),
      replies: [],
    };

    const html = renderTemplate(theme.html, theme.css, templateData);

    const blogInfo = {
      id: blog.id,
      nickname: blog.nickname,
      description: blog.description,
      logo_image: blog.logo_image,
      address: blog.address,
    };

    return (
      <BlogProvider blogId={Number(blog.id)} blogInfo={blogInfo}>
        <BlogLayout blogId={Number(blog.id)} html={String(html)} css={String(theme.css)} />
      </BlogProvider>
    );
  } catch (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">오류가 발생했습니다</h1>
          <p className="text-gray-600">페이지를 불러오는 중 문제가 발생했습니다.</p>
        </div>
      </div>
    );
  }
}
