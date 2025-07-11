import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import BlogProvider from '../../../components/BlogProvider';
import BlogRenderer from '../../../components/BlogRenderer';
import ContentStats from '../../../components/ContentStats';
import { getCurrentUser } from '../../../lib/auth';
import { getBlogAddress } from '../../../lib/blogUtils';
import { getSidebarData } from '../../api/sidebarData';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getPageByTitle, getPagesByBlogId, getUncategorizedCountByBlogId } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';

interface PageProps {
  params: Promise<{
    pageName: string;
  }>;
}

// URL에서 페이지 이름을 정규화하는 함수
function normalizePageName(pageName: string): string {
  try {
    // 1차: URL 디코딩 (한글 등 유니코드 문자 처리)
    let decoded = decodeURIComponent(pageName);

    // 2차: 공백 관련 인코딩 처리 (단, 의미있는 문자는 보존)
    decoded = decoded.replace(/\+/g, ' '); // + → 공백
    decoded = decoded.replace(/%20/g, ' '); // %20 → 공백 (추가 보장)

    // 3차: 연속된 공백 정규화 및 trim
    decoded = decoded.replace(/\s+/g, ' ').trim();

    return decoded;
  } catch (error) {
    // 디코딩 실패 시 원본 반환
    return pageName.trim();
  }
}

export default async function PagesByTitlePage({ params }: PageProps) {
  const resolvedParams = await params;
  const { pageName } = resolvedParams;

  // URL 디코딩 및 스페이스 처리
  const decodedPageName = normalizePageName(pageName);

  // 1. 블로그 주소 추출
  const subdomain = await getBlogAddress();

  // 2. 블로그 정보 조회
  const blog = await getBlogByAddress(subdomain);
  if (!blog) {
    notFound();
  }

  // 3. title로 페이지 정보 조회
  let pageContent = await getPageByTitle(blog.id, decodedPageName);

  // 페이지를 찾지 못한 경우 추가 시도
  if (!pageContent) {
    // 모든 PAGE 타입 컨텐츠를 조회해서 제목 매칭 시도
    const allPages = await getPagesByBlogId(blog.id);

    // 정확한 제목 매칭
    pageContent = allPages.find((page) => page.title === decodedPageName) || null;

    // 여전히 없으면 URL 디코딩 없이 시도
    if (!pageContent) {
      pageContent = allPages.find((page) => page.title === pageName) || null;
    }

    // 여전히 없으면 대소문자 무시하고 시도
    if (!pageContent) {
      pageContent = allPages.find((page) => page.title.toLowerCase() === decodedPageName.toLowerCase()) || null;
    }
  }

  if (!pageContent) {
    notFound();
  }

  // 4. 카테고리 정보 조회
  const categories = await getCategoriesByBlogId(blog.id);

  // 5. 사이드바 데이터 불러오기
  const sidebarData = await getSidebarData(blog.id);

  // 6. 메뉴 정보 조회
  const menus = await getMenusByBlogId(blog.id);

  // 7. 분류 없음 글 개수 조회
  const uncategorizedCount = await getUncategorizedCountByBlogId(blog.id);

  // 8. 현재 사용자 정보 가져오기
  const currentUser = await getCurrentUser();

  // 9. 실제 조회수 조회 (서버 사이드)
  let totalViews = 0;
  try {
    const viewsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/content-stats/views/${pageContent.id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (viewsResponse.ok) {
      totalViews = await viewsResponse.json();
    }
  } catch (error) {
    totalViews = 0;
  }

  // 10. 템플릿 데이터 구성 (글 상세 페이지와 동일)
  const templateData = {
    blog: {
      nickname: String(blog.nickname),
      description: blog.description ? String(blog.description) : null,
      logo_image: blog.logo_image ? String(blog.logo_image) : null,
      address: String(blog.address),
      author: undefined, // PAGE 타입에서는 작성자 정보 표시하지 않음
    },
    categories: categories.map((category) => ({
      id: Number(category.id),
      name: String(category.name),
      post_count: Number(category.post_count),
      category_id: category.category_id == null ? null : Number(category.category_id),
    })),
    uncategorizedCount: Number(uncategorizedCount), // 분류 없음 글 개수 추가
    menus: menus.map((menu) => ({
      id: Number(menu.id),
      name: String(menu.name),
      type: String(menu.type),
      uri: String(menu.uri),
      is_blank: Boolean(menu.is_blank),
    })),
    contents: [], // 페이지 상세에서는 contents 배열은 비움
    // 현재 페이지 정보를 currentArticle로 설정
    currentArticle: {
      id: Number(pageContent.id),
      sequence: Number(pageContent.sequence),
      title: String(pageContent.title),
      content_html: String(pageContent.content_html),
      content_plain: String(pageContent.content_plain),
      created_at: String(pageContent.created_at),
      type: 'PAGE' as const, // PAGE 타입 명시
      thumbnail: pageContent.thumbnail ? String(pageContent.thumbnail) : undefined,
      category: pageContent.category
        ? {
            id: Number(pageContent.category.id),
            name: String(pageContent.category.name),
          }
        : undefined,
      reply_count: Number(pageContent.reply_count ?? 0),
      total_views: totalViews, // 조회수 추가
    },
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
    replies: [], // PAGE 타입에서는 댓글 기능 비활성화
    recentReplies: sidebarData.recentReplies,
    isAllPostsPage: false, // 페이지 상세이므로 false
  };

  // 11. 블로그 정보 구성
  const blogInfo = {
    id: blog.id,
    nickname: blog.nickname,
    description: blog.description,
    logo_image: blog.logo_image,
    address: blog.address,
  };

  return (
    <BlogProvider blogInfo={blogInfo} sidebarData={sidebarData}>
      <ContentStats contentId={pageContent.id} userId={currentUser?.id} />
      <BlogRenderer blogId={blog.id} templateData={templateData} />
    </BlogProvider>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { pageName } = resolvedParams;

  // URL 디코딩 및 스페이스 처리 (메인 함수와 동일)
  const decodedPageName = normalizePageName(pageName);

  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);
  const pageContent = await getPageByTitle(blog?.id || 0, decodedPageName);

  if (!pageContent || !blog) {
    return {
      title: '페이지를 찾을 수 없습니다 | PostSmith Blog',
      description: '요청하신 페이지가 존재하지 않습니다.',
    };
  }

  return {
    title: `${pageContent.title} | ${blog.nickname}`,
    description: pageContent.content_plain ? pageContent.content_plain.substring(0, 160) + '...' : `${blog.nickname}의 ${pageContent.title} 페이지입니다.`,
    openGraph: {
      title: pageContent.title,
      description: pageContent.content_plain ? pageContent.content_plain.substring(0, 160) + '...' : `${blog.nickname}의 ${pageContent.title} 페이지입니다.`,
      type: 'article',
      siteName: blog.nickname,
      ...(pageContent.thumbnail && {
        images: [
          {
            url: pageContent.thumbnail,
            alt: pageContent.title,
          },
        ],
      }),
    },
  };
}
