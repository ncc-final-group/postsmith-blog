import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import React from 'react';

import { getSidebarData } from './api/sidebarData';
import { getBlogByAddress } from './api/tbBlogs';
import { getCategoriesByBlogId } from './api/tbCategories';
import { getPostsByBlogIdWithPaging, getUncategorizedCountByBlogId } from './api/tbContents';
import { getMenusByBlogId } from './api/tbMenu';
import SafeBlogProvider from '../components/SafeBlogProvider';
import { getCurrentUser } from '../lib/auth';
import { getBlogAddress } from '../lib/blogUtils';
import { renderTemplate } from '../lib/template/TemplateEngine';
import { getThemeByBlogId } from '../lib/themeService';

import BlogLayout from '@components/BlogLayout';

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

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  // 서버에서 블로그 주소 추출하여 블로그 정보 조회
  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);
  if (!blog) {
    notFound();
  }

  const themeData = await getThemeByBlogId(blog.id);
  if (!themeData) {
    notFound();
  }

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = await getCurrentUser();

  // 블로그 소유자인지 확인
  const isOwner = currentUser && currentUser.id === currentUser.id;
  const ownerUserId = isOwner ? currentUser.id : undefined;

  const categories = await getCategoriesByBlogId(blog.id);
  const paginatedContents = await getPostsByBlogIdWithPaging(blog.id, page, 10, ownerUserId);
  const menus = await getMenusByBlogId(blog.id);
  const uncategorizedCount = await getUncategorizedCountByBlogId(blog.id, ownerUserId);

  // 사이드바 데이터 불러오기
  const sidebarData = await getSidebarData(blog.id, ownerUserId);

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
    uncategorizedCount: Number(uncategorizedCount),
    totalContentsCount: Number(paginatedContents.pagination.totalContents),
    menus: menus.map((menu) => ({
      id: Number(menu.id),
      name: String(menu.name),
      type: String(menu.type),
      uri: String(menu.uri),
      is_blank: Boolean(menu.is_blank),
    })),
    contents: paginatedContents.contents.map((content) => ({
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
    recentReplies: sidebarData.recentReplies,
    replies: [],
    isAllPostsPage: true, // 메인 페이지 플래그 추가
    pagination: paginatedContents.pagination, // 페이지네이션 정보 추가
    // 사이드바 데이터 추가 (기존 recentReplies는 유지)
    recentContents: sidebarData.recentContents,
    popularContents: sidebarData.popularContents.map((item) => ({
      ...item,
      created_at: '',
      content_html: '',
      content_plain: '',
      thumbnail: undefined,
      category: undefined,
    })),
  };

  const html = renderTemplate(themeData.themeHtml, themeData.themeCss, templateData);

  const blogInfo = {
    id: blog.id,
    nickname: blog.nickname,
    description: blog.description,
    logo_image: blog.logo_image,
    address: blog.address,
  };

  return (
    <SafeBlogProvider blogId={Number(blog.id)} blogInfo={blogInfo} sidebarData={sidebarData}>
      <BlogLayout blogId={Number(blog.id)} html={String(html)} css={String(themeData.themeCss)} />
    </SafeBlogProvider>
  );
}
