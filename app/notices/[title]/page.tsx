import { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import React from 'react';

import BlogLayout from '../../../components/BlogLayout';
import SafeBlogProvider from '../../../components/SafeBlogProvider';
import { getCurrentUser } from '../../../lib/auth';
import { renderTemplate } from '../../../lib/template/TemplateEngine';
import { getSidebarData } from '../../api/sidebarData';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getNoticeByTitle, getUncategorizedCountByBlogId } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';
import { getActiveThemeByBlogId } from '../../api/tbThemes';

async function getBlogAddress(): Promise<string> {
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
}

interface NoticeProps {
  params: Promise<{
    title: string;
  }>;
}

// URL에서 공지사항 제목을 정규화하는 함수
function normalizeNoticeTitle(title: string): string {
  try {
    // 1차: URL 디코딩 (한글 등 유니코드 문자 처리)
    let decoded = decodeURIComponent(title);

    // 2차: 공백 관련 인코딩 처리
    decoded = decoded.replace(/\+/g, ' '); // + → 공백
    decoded = decoded.replace(/%20/g, ' '); // %20 → 공백 (추가 보장)

    // 3차: 연속된 공백 정규화 및 trim
    decoded = decoded.replace(/\s+/g, ' ').trim();

    return decoded;
  } catch (error) {
    // 디코딩 실패 시 원본 반환
    return title.trim();
  }
}

export default async function NoticeByTitlePage({ params }: NoticeProps) {
  const resolvedParams = await params;
  const { title } = resolvedParams;

  // URL 디코딩 및 스페이스 처리
  const decodedTitle = normalizeNoticeTitle(title);

  // 1. 블로그 주소 추출
  const subdomain = await getBlogAddress();

  // 2. 블로그 정보 조회
  const blog = await getBlogByAddress(subdomain);
  if (!blog) {
    notFound();
  }

  // 3. title로 공지사항 정보 조회
  let noticeContent = await getNoticeByTitle(blog.id, decodedTitle);

  // 공지사항을 찾지 못한 경우 추가 시도
  if (!noticeContent) {
    // 모든 NOTICE 타입 컨텐츠를 조회해서 제목 매칭 시도 (getNoticesByBlogId 사용)
    const { getNoticesByBlogId } = await import('../../api/tbContents');
    const allNotices = await getNoticesByBlogId(blog.id);

    // 정확한 제목 매칭
    noticeContent = allNotices.find((notice) => notice.title === decodedTitle) || null;

    // 여전히 없으면 URL 디코딩 없이 시도
    if (!noticeContent) {
      noticeContent = allNotices.find((notice) => notice.title === title) || null;
    }

    // 여전히 없으면 대소문자 무시하고 시도
    if (!noticeContent) {
      noticeContent = allNotices.find((notice) => notice.title.toLowerCase() === decodedTitle.toLowerCase()) || null;
    }
  }

  if (!noticeContent) {
    notFound();
  }

  // 4. 테마 정보 조회
  const theme = await getActiveThemeByBlogId(blog.id);
  if (!theme) {
    notFound();
  }

  // 5. 카테고리 정보 조회
  const categories = await getCategoriesByBlogId(blog.id);

  // 6. 댓글 목록 조회 (NOTICE 타입에서는 댓글 기능 비활성화)
  const replies: any[] = [];

  // 7. 사이드바 데이터 불러오기
  const sidebarData = await getSidebarData(blog.id);

  // 8. 메뉴 정보 조회
  const menus = await getMenusByBlogId(blog.id);

  // 9. 분류 없음 글 개수 조회
  const uncategorizedCount = await getUncategorizedCountByBlogId(blog.id);

  // 10. 현재 사용자 정보 가져오기
  const currentUser = await getCurrentUser();

  // 10. 템플릿 데이터 구성 (공지사항 상세 페이지)
  const templateData = {
    blog: {
      nickname: String(blog.nickname),
      description: blog.description ? String(blog.description) : null,
      logo_image: blog.logo_image ? String(blog.logo_image) : null,
      address: String(blog.address),
      author: undefined, // NOTICE 타입에서는 작성자 정보 표시하지 않음
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
    contents: [], // 공지사항 상세에서는 contents 배열은 비움
    // 현재 공지사항 정보를 currentArticle로 설정
    currentArticle: {
      id: Number(noticeContent.id),
      sequence: Number(noticeContent.sequence),
      title: String(noticeContent.title),
      content_html: String(noticeContent.content_html),
      content_plain: String(noticeContent.content_plain),
      created_at: String(noticeContent.created_at),
      type: 'NOTICE' as const, // NOTICE 타입 명시
      thumbnail: noticeContent.thumbnail ? String(noticeContent.thumbnail) : undefined,
      category: noticeContent.category
        ? {
            id: Number(noticeContent.category.id),
            name: String(noticeContent.category.name),
          }
        : undefined,
      reply_count: Number(noticeContent.reply_count ?? 0),
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
    replies: [], // NOTICE 타입에서는 댓글 기능 비활성화
    recentReplies: sidebarData.recentReplies,
    isAllPostsPage: false, // 공지사항 상세이므로 false
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

  // 사용자 정보를 IUserSession 형태로 변환
  const session = currentUser
    ? {
        accessToken: undefined,
        userId: String(currentUser.id),
        email: currentUser.email,
        role: currentUser.role,
        userNickname: currentUser.nickname,
        profileImage: undefined,
      }
    : undefined;

  return (
    <SafeBlogProvider blogId={Number(blog.id)} blogInfo={blogInfo} sidebarData={sidebarData}>
      <BlogLayout blogId={Number(blog.id)} html={String(html)} css={String(theme.css)} />
    </SafeBlogProvider>
  );
}

export async function generateMetadata({ params }: NoticeProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { title } = resolvedParams;

  // URL 디코딩 및 스페이스 처리 (메인 함수와 동일)
  const decodedTitle = normalizeNoticeTitle(title);

  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);
  const noticeContent = await getNoticeByTitle(blog?.id || 0, decodedTitle);

  if (!noticeContent || !blog) {
    return {
      title: '공지사항을 찾을 수 없습니다 | PostSmith Blog',
      description: '요청하신 공지사항이 존재하지 않습니다.',
    };
  }

  return {
    title: `${noticeContent.title} | ${blog.nickname}`,
    description: noticeContent.content_plain ? noticeContent.content_plain.substring(0, 160) + '...' : `${blog.nickname}의 ${noticeContent.title} 공지사항입니다.`,
    openGraph: {
      title: noticeContent.title,
      description: noticeContent.content_plain ? noticeContent.content_plain.substring(0, 160) + '...' : `${blog.nickname}의 ${noticeContent.title} 공지사항입니다.`,
      type: 'article',
      siteName: blog.nickname,
      ...(noticeContent.thumbnail && {
        images: [
          {
            url: noticeContent.thumbnail,
            alt: noticeContent.title,
          },
        ],
      }),
    },
  };
}
