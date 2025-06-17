import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import React from 'react';

import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getPageByTitle, getPagesByBlogId, getUncategorizedCountByBlogId } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';
import { getSidebarData } from '../../api/sidebarData';
import { getActiveThemeByBlogId } from '../../api/tbThemes';
import BlogLayout from '../../components/BlogLayout';
import BlogProvider from '../../components/BlogProvider';
import { renderTemplate } from '../../../lib/template/TemplateEngine';

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
    decoded = decoded.replace(/\+/g, ' ');          // + → 공백
    decoded = decoded.replace(/%20/g, ' ');         // %20 → 공백 (추가 보장)
    
    // 3차: 연속된 공백 정규화 및 trim
    decoded = decoded.replace(/\s+/g, ' ').trim();
    
    return decoded;
  } catch (error) {
    // 디코딩 실패 시 원본 반환
    return pageName.trim();
  }
}

export default async function PagesByTitlePage({ params }: PageProps) {
  try {
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
      pageContent = allPages.find(page => page.title === decodedPageName) || null;
      
      // 여전히 없으면 URL 디코딩 없이 시도
      if (!pageContent) {
        pageContent = allPages.find(page => page.title === pageName) || null;
      }
      
      // 여전히 없으면 대소문자 무시하고 시도
      if (!pageContent) {
        pageContent = allPages.find(page => 
          page.title.toLowerCase() === decodedPageName.toLowerCase()
        ) || null;
      }
    }
    
    if (!pageContent) {
      notFound();
    }

    // 4. 테마 정보 조회
    const theme = await getActiveThemeByBlogId(blog.id);
    if (!theme) {
      notFound();
    }

    // 5. 카테고리 정보 조회
    const categories = await getCategoriesByBlogId(blog.id);

    // 6. 댓글 목록 조회 (PAGE 타입에서는 댓글 기능 비활성화)
    const replies: any[] = [];

    // 7. 사이드바 데이터 불러오기
    const sidebarData = await getSidebarData(blog.id);

    // 8. 메뉴 정보 조회
    const menus = await getMenusByBlogId(blog.id);

    // 9. 분류 없음 글 개수 조회
    const uncategorizedCount = await getUncategorizedCountByBlogId(blog.id);

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

    // 11. 템플릿 렌더링
    const html = renderTemplate(theme.html, theme.css, templateData);

    // 12. 블로그 정보 구성
    const blogInfo = {
      id: blog.id,
      nickname: blog.nickname,
      description: blog.description,
      logo_image: blog.logo_image,
      address: blog.address,
    };

    return (
      <BlogProvider blogId={Number(blog.id)} blogInfo={blogInfo} sidebarData={sidebarData}>
        <BlogLayout blogId={Number(blog.id)} html={String(html)} css={String(theme.css)} />
      </BlogProvider>
    );
  } catch (error) {
    // 디버깅 정보를 포함한 에러 페이지
    const resolvedParams = await params;
    const { pageName } = resolvedParams;
    const decodedPageName = normalizePageName(pageName);
    
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-6">
          <h1 className="mb-4 text-2xl font-bold text-red-600">페이지를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
          <div className="bg-gray-100 p-4 rounded-lg text-left text-sm">
            <h3 className="font-bold mb-2">디버깅 정보:</h3>
            <p><strong>원본 URL 파라미터:</strong> {pageName}</p>
            <p><strong>디코딩된 이름:</strong> {decodedPageName}</p>
            <p><strong>오류:</strong> {error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          </div>
        </div>
      </div>
    );
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
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
      description: pageContent.content_plain ? 
        pageContent.content_plain.substring(0, 160) + '...' : 
        `${blog.nickname}의 ${pageContent.title} 페이지입니다.`,
      openGraph: {
        title: pageContent.title,
        description: pageContent.content_plain ? 
          pageContent.content_plain.substring(0, 160) + '...' : 
          `${blog.nickname}의 ${pageContent.title} 페이지입니다.`,
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
  } catch (error) {
    return {
      title: '페이지를 찾을 수 없습니다 | PostSmith Blog',
      description: '요청하신 페이지가 존재하지 않습니다.',
    };
  }
} 