import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import BlogProvider from '../../../components/BlogProvider';
import BlogRenderer from '../../../components/BlogRenderer';
import { getCurrentUser } from '../../../lib/auth';
import { getBlogAddress } from '../../../lib/blogUtils';
import { getSidebarData } from '../../api/sidebarData';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getUncategorizedContentsByBlogIdWithPaging, getUncategorizedCountByBlogId } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';

export default async function UncategorizedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);

  // 현재 블로그와 사용자 정보 가져오기 (app/page.tsx와 동일한 방식)
  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);

  if (!blog) {
    notFound();
  }

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = await getCurrentUser();

  // 블로그 소유자인지 확인
  const isOwner = currentUser && currentUser.id === blog.user_id;
  const ownerUserId = isOwner ? currentUser.id : undefined;

  // 카테고리 정보 조회
  const categories = await getCategoriesByBlogId(blog.id);

  // 분류 없는 글 목록 조회 (페이징)
  const paginatedContents = await getUncategorizedContentsByBlogIdWithPaging(blog.id, page, 10, ownerUserId);

  // 메뉴 정보 조회
  const menus = await getMenusByBlogId(blog.id);

  // 분류 없음 글 개수 조회
  const uncategorizedCount = await getUncategorizedCountByBlogId(blog.id, ownerUserId);

  // 사이드바 데이터 불러오기 (app/page.tsx와 동일)
  const sidebarData = await getSidebarData(blog.id, ownerUserId);

  // 템플릿 데이터 구성
  const templateData = {
    blog: {
      nickname: String(blog.nickname),
      description: blog.description ? String(blog.description) : null,
      logo_image: blog.logo_image ? String(blog.logo_image) : null,
      address: String(blog.address),
      author: undefined,
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
      is_blank: Boolean(menu.is_blank ?? false),
    })),
    contents: paginatedContents.contents.map((content) => ({
      sequence: Number(content.sequence),
      title: String(content.title),
      content_html: String(content.content_html),
      content_plain: String(content.content_plain),
      created_at: String(content.created_at),
      thumbnail: content.thumbnail ? String(content.thumbnail) : undefined,
      category: undefined, // 분류 없음이므로 undefined
      reply_count: Number(content.reply_count ?? 0),
    })),
    recentReplies: sidebarData.recentReplies,
    replies: [], // 목록 페이지에서는 댓글 목록 불필요
    isAllPostsPage: true, // 분류 없음도 목록 페이지로 처리
    pagination: paginatedContents.pagination, // 페이지네이션 정보 추가
    currentCategoryName: '분류 없음', // 현재 카테고리 이름 추가
    // 사이드바 데이터 추가 (app/page.tsx와 동일)
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

  // BlogProvider로 감싸서 blogStore에 blog 정보 저장 (app/page.tsx와 동일)
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

export async function generateMetadata(): Promise<Metadata> {
  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);

  // 현재 로그인한 사용자 정보 가져오기
  const currentUser = await getCurrentUser();
  const isOwner = currentUser && blog && currentUser.id === blog.user_id;
  const ownerUserId = isOwner ? currentUser.id : undefined;

  const uncategorizedContents = await getUncategorizedContentsByBlogIdWithPaging(blog?.id || 0, 1, 10, ownerUserId);
  const totalCount = uncategorizedContents.pagination.totalContents;

  return {
    title: `분류 없음 (${totalCount}개) | ${blog?.nickname || 'PostSmith Blog'}`,
    description: `${blog?.nickname || 'PostSmith Blog'}의 분류되지 않은 글들을 확인해보세요. 총 ${totalCount}개의 글이 있습니다.`,
  };
}
