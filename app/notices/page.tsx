import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import BlogProvider from '../../components/BlogProvider';
import BlogRenderer from '../../components/BlogRenderer';
import { getBlogAddress } from '../../lib/blogUtils';
import { getSidebarData } from '../api/sidebarData';
import { getBlogByAddress } from '../api/tbBlogs';
import { getCategoriesByBlogId } from '../api/tbCategories';
import { getNoticesByBlogId, getNoticesByBlogIdWithPaging } from '../api/tbContents';
import { getMenusByBlogId } from '../api/tbMenu';

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  try {
    const resolvedSearchParams = await searchParams;
    const page = parseInt(resolvedSearchParams.page || '1', 10);

    // 1. 블로그 주소 추출
    const subdomain = await getBlogAddress();

    // 2. 블로그 정보 조회
    const blog = await getBlogByAddress(subdomain);
    if (!blog) {
      notFound();
    }

    // 3. 카테고리 정보 조회
    const categories = await getCategoriesByBlogId(blog.id);

    // 4. 공지사항 목록 조회 (페이징)
    const paginatedNotices = await getNoticesByBlogIdWithPaging(blog.id, page, 10);

    // 5. 사이드바 데이터 불러오기 (최근글, 인기글, 최근 댓글)
    const sidebarData = await getSidebarData(blog.id);

    // 6. 메뉴 정보 조회
    const menus = await getMenusByBlogId(blog.id);

    // 7. 템플릿 데이터 구성
    const templateData = {
      blog: {
        nickname: String(blog.nickname),
        description: blog.description ? String(blog.description) : null,
        logo_image: blog.logo_image ? String(blog.logo_image) : null,
        address: String(blog.address),
        author: undefined, // 공지사항 목록 페이지에서는 작성자 정보 불필요
      },
      // API 서버 URL 추가
      apiServerUrl: process.env.NEXT_PUBLIC_API_SERVER,
      categories: categories.map((category) => ({
        id: Number(category.id),
        name: String(category.name),
        post_count: Number(category.post_count),
        category_id: category.category_id == null ? null : Number(category.category_id),
      })),
      menus: menus.map((menu) => ({
        id: Number(menu.id),
        name: String(menu.name),
        type: String(menu.type),
        uri: String(menu.uri),
        is_blank: Boolean(menu.is_blank),
      })),
      contents: paginatedNotices.contents.map((content) => ({
        sequence: Number(content.sequence),
        title: String(content.title),
        content_html: String(content.content_html),
        content_plain: String(content.content_plain),
        created_at: String(content.created_at),
        type: 'NOTICE' as const, // NOTICE 타입 명시
        thumbnail: content.thumbnail ? String(content.thumbnail) : undefined,
        category: content.category
          ? {
              id: Number(content.category.id),
              name: String(content.category.name),
            }
          : undefined,
        reply_count: Number(content.reply_count ?? 0),
      })),
      // 사이드바 데이터 추가
      recentContents: sidebarData.recentContents,
      popularContents: sidebarData.popularContents.map((item) => ({
        ...item,
        created_at: '',
        content_html: '',
        content_plain: '',
        thumbnail: undefined,
        category: undefined,
      })),
      recentReplies: sidebarData.recentReplies,
      replies: [], // 공지사항 목록 페이지에서는 댓글 목록 불필요
      isAllPostsPage: true, // 공지사항도 목록 페이지로 처리
      pagination: paginatedNotices.pagination, // 페이지네이션 정보 추가
    };

    // 8. 블로그 정보 구성
    const blogInfo = {
      id: blog.id,
      nickname: blog.nickname,
      description: blog.description,
      logo_image: blog.logo_image,
      address: blog.address,
    };

    return (
      <BlogProvider blogInfo={blogInfo} sidebarData={sidebarData}>
        <BlogRenderer blogId={blog.id} templateData={templateData} />
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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const subdomain = await getBlogAddress();
    const blog = await getBlogByAddress(subdomain);
    const notices = await getNoticesByBlogId(blog?.id || 0);
    const totalNotices = notices.length;

    return {
      title: `공지사항 (${totalNotices}개) | ${blog?.nickname || 'PostSmith Blog'}`,
      description: `${blog?.nickname || 'PostSmith Blog'}의 공지사항을 확인해보세요. 총 ${totalNotices}개의 공지사항이 있습니다.`,
    };
  } catch (error) {
    return {
      title: '공지사항 | PostSmith Blog',
      description: 'PostSmith Blog의 공지사항을 확인해보세요.',
    };
  }
}
