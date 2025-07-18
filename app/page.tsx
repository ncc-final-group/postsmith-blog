import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import { getSidebarData } from './api/sidebarData';
import { getBlogByAddress } from './api/tbBlogs';
import { getCategoriesByBlogId } from './api/tbCategories';
import { getPostsByBlogIdWithPaging, getUncategorizedCountByBlogId } from './api/tbContents';
import { getMenusByBlogId } from './api/tbMenu';
import { getCurrentUser } from '../lib/auth';
import { getBlogAddress } from '../lib/blogUtils';
// renderTemplate과 getThemeByBlogId는 이제 BlogThemeLoader에서 사용

import BlogProvider from '@components/BlogProvider';
import BlogRenderer from '@components/BlogRenderer';

export async function generateMetadata(): Promise<Metadata> {
  // getBlogAddress 함수 사용으로 통일 (중복 제거)
  const address = await getBlogAddress();

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

  // 현재 블로그와 사용자 정보 가져오기 (usermanage와 동일한 방식)
  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);

  if (!blog) {
    notFound();
  }

  // 테마는 클라이언트에서 BlogStore를 통해 로드

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = await getCurrentUser();

  // 블로그 소유자인지 확인 (usermanage와 동일한 방식)
  const isOwner = currentUser && currentUser.id === blog.user_id;
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

  // BlogProvider로 감싸서 blogStore에 blog 정보 저장
  // 이제 PreviewRenderer 방식을 기본으로 사용 (모바일 메뉴가 제대로 작동함)
  return (
    <BlogProvider
      blogInfo={{
        id: blog.id,
        nickname: blog.nickname,
        description: blog.description,
        logo_image: blog.logo_image,
        address: blog.address,
      }}
      sidebarData={sidebarData}
    >
      <BlogRenderer blogId={blog.id} templateData={templateData} />
    </BlogProvider>
  );
}
