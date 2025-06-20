import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import BlogLayout from '../../../components/BlogLayout';
import ContentStats from '../../../components/ContentStats';
import SafeBlogProvider from '../../../components/SafeBlogProvider';
import { getCurrentUser } from '../../../lib/auth';
import { renderTemplate } from '../../../lib/template/TemplateEngine';
import { getThemeByBlogId } from '../../../lib/themeService';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getContentsByBlogId, getNextPost, getPopularContentsByBlogId, getPostBySequence, getPrevPost, getUncategorizedCountByBlogId } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';
import { getRecentReplies, getRepliesByContentId, Reply } from '../../api/tbReplies';

// 댓글 계층 구조 인터페이스
interface HierarchicalReply extends Reply {
  children: HierarchicalReply[];
  depth: number;
}

// 댓글을 계층 구조로 변환하는 함수
function buildReplyHierarchy(replies: Reply[]): HierarchicalReply[] {
  const replyMap = new Map<number, HierarchicalReply>();
  const rootReplies: HierarchicalReply[] = [];

  // 모든 댓글을 맵에 저장하고 children 배열 초기화
  replies.forEach((reply) => {
    replyMap.set(reply.id, {
      ...reply,
      children: [],
      depth: 0,
    });
  });

  // 부모-자식 관계 설정
  replies.forEach((reply) => {
    const currentReply = replyMap.get(reply.id)!;

    if (reply.reply_id && replyMap.has(reply.reply_id)) {
      // 대댓글인 경우
      const parentReply = replyMap.get(reply.reply_id)!;
      currentReply.depth = parentReply.depth + 1;
      parentReply.children.push(currentReply);
    } else {
      // 최상위 댓글인 경우
      rootReplies.push(currentReply);
    }
  });

  // 각 레벨에서 시간순으로 정렬 (오래된 순)
  const sortReplies = (replies: HierarchicalReply[]) => {
    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    replies.forEach((reply) => {
      if (reply.children.length > 0) {
        sortReplies(reply.children);
      }
    });
  };

  sortReplies(rootReplies);
  return rootReplies;
}

// 계층 구조를 평면 배열로 변환 (렌더링용)
function flattenReplies(hierarchicalReplies: HierarchicalReply[]): HierarchicalReply[] {
  const result: HierarchicalReply[] = [];

  const traverse = (replies: HierarchicalReply[]) => {
    replies.forEach((reply) => {
      result.push(reply);
      if (reply.children.length > 0) {
        traverse(reply.children);
      }
    });
  };

  traverse(hierarchicalReplies);
  return result;
}

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

export default async function PostPage({ params }: { params: Promise<{ sequence: string }> }) {
  // 1. 파라미터 검증
  const resolvedParams = await params;
  if (!resolvedParams.sequence || isNaN(parseInt(resolvedParams.sequence))) {
    notFound();
  }

  // 2. 블로그 주소 추출
  const subdomain = await getBlogAddress();
  if (!subdomain) {
    notFound();
  }

  // 3. 블로그 정보 조회
  const blog = await getBlogByAddress(subdomain);
  if (!blog) {
    notFound();
  }

  // 4. 테마 정보 조회
  const themeData = await getThemeByBlogId(blog.id);
  if (!themeData) {
    notFound();
  }

  // 4.5. 현재 로그인한 사용자 정보 가져오기
  const currentUser = await getCurrentUser();

  // 블로그 소유자인지 확인
  const isOwner = currentUser && currentUser.id === blog.user_id;
  const ownerUserId = isOwner ? currentUser.id : undefined;

  // 5. 카테고리 정보 조회
  const categories = await getCategoriesByBlogId(blog.id);

  // 6. 글 내용 조회 (POSTS 타입만)
  const content = await getPostBySequence(blog.id, parseInt(resolvedParams.sequence), ownerUserId);
  if (!content) {
    notFound();
  }

  // 7. 전체 글 목록 조회 (최근 글 표시용)
  const allContents = await getContentsByBlogId(blog.id, ownerUserId);

  // 7-1. 인기글 목록 조회 (최근 한 달 기준: 댓글 수 + 방문자 수)
  const popularContents = await getPopularContentsByBlogId(blog.id);

  // content_html이 비어있는 경우 처리
  if (!content.content_html || content.content_html.trim() === '') {
    // content_html이 비어있으면 content_plain을 사용하거나 기본 메시지 표시
    content.content_html = content.content_plain ? `<p>${content.content_plain}</p>` : '<p>내용이 없습니다.</p>';
  }

  // 8. 이전/다음 글 가져오기 (POSTS 타입만)
  const prevContent = await getPrevPost(blog.id, parseInt(resolvedParams.sequence), ownerUserId);
  const nextContent = await getNextPost(blog.id, parseInt(resolvedParams.sequence), ownerUserId);

  // 9. 최근 댓글 조회
  const recentReplies = await getRecentReplies(blog.id);

  // 10. 해당 글의 댓글 조회
  const contentReplies = await getRepliesByContentId(content.id);

  // 10-1. 댓글을 계층 구조로 변환
  const hierarchicalReplies = buildReplyHierarchy(contentReplies);
  const flattenedReplies = flattenReplies(hierarchicalReplies);

  // 11. 메뉴 정보 조회
  const menus = await getMenusByBlogId(blog.id);

  // 12. 분류 없음 글 개수 조회
  const uncategorizedCount = await getUncategorizedCountByBlogId(blog.id, ownerUserId);

  // 13. 실제 조회수 조회 (서버 사이드)
  let totalViews = 0;
  try {
    // Spring API를 직접 호출
    const springApiUrl = `${process.env.NEXT_PUBLIC_API_SERVER}/api/content_stats/views/${content.id}`;
    
    const viewsResponse = await fetch(springApiUrl, {
      method: 'GET',
      cache: 'no-store'
    });
    
    if (viewsResponse.ok) {
      const result = await viewsResponse.json();
      
      // Spring API 응답 형식에 따라 처리
      if (typeof result === 'number') {
        totalViews = result;
      } else if (result && typeof result.totalViews !== 'undefined') {
        totalViews = result.totalViews;
      } else if (result && typeof result.total_views !== 'undefined') {
        totalViews = result.total_views;
      } else {
        totalViews = 0;
      }
    }
  } catch (error) {
    totalViews = 0;
  }

  // 14. 템플릿 데이터 구성
  const templateData = {
    blog: {
      nickname: String(blog.nickname),
      description: blog.description ? String(blog.description) : null,
      logo_image: blog.logo_image ? String(blog.logo_image) : null,
      address: String(blog.address),
      author: '블로그 관리자',
    },
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
    contents: allContents.map((contentItem) => ({
      sequence: Number(contentItem.sequence),
      title: String(contentItem.title),
      content_html: String(contentItem.content_html || ''),
      content_plain: String(contentItem.content_plain || ''),
      created_at: String(contentItem.created_at),
      thumbnail: contentItem.thumbnail ? String(contentItem.thumbnail) : undefined,
      category: contentItem.category
        ? {
            id: Number(contentItem.category.id),
            name: String(contentItem.category.name),
          }
        : undefined,
      reply_count: Number(contentItem.reply_count ?? 0),
    })),
    // 인기글 데이터 추가 (최근 한 달 기준: 댓글 수 + 방문자 수)
    popularContents: popularContents.map((popularContent) => ({
      sequence: Number(popularContent.sequence),
      title: String(popularContent.title),
      content_id: Number(popularContent.content_id),
      recent_reply_count: Number(popularContent.recent_reply_count),
      recent_visit_count: Number(popularContent.recent_visit_count),
      popularity_score: Number(popularContent.popularity_score),
      created_at: '', // 필요시 추가 조회
      content_html: '',
      content_plain: '',
      thumbnail: undefined,
      category: undefined,
      reply_count: Number(popularContent.recent_reply_count), // 최근 한 달 댓글 수로 설정
    })),
    uncategorizedCount: Number(uncategorizedCount), // 분류 없음 글 개수 추가
    // 개별 글 페이지용 데이터 추가
    currentArticle: {
      id: Number(content.id), // 실제 contents 테이블의 id (조회수용)
      sequence: Number(content.sequence),
      title: String(content.title),
      content_html: String(content.content_html),
      content_plain: String(content.content_plain),
      created_at: String(content.created_at),
      type: content.type as 'POSTS' | 'PAGE' | 'NOTICE', // 글 타입 추가
      thumbnail: content.thumbnail ? String(content.thumbnail) : undefined,
      category: content.category
        ? {
            id: Number(content.category.id),
            name: String(content.category.name),
          }
        : undefined,
      reply_count: Number(content.reply_count ?? 0),
      author: '블로그 관리자',
      tags: [], // 태그는 미구현
      prev_article: prevContent
        ? {
            sequence: Number(prevContent.sequence),
            title: String(prevContent.title),
          }
        : undefined,
      next_article: nextContent
        ? {
            sequence: Number(nextContent.sequence),
            title: String(nextContent.title),
          }
        : undefined,
      total_views: totalViews,
    },
    recentReplies: recentReplies.map((reply) => ({
      id: Number(reply.id),
      content_id: Number(reply.content_id),
      content: String(reply.content),
      created_at: String(reply.created_at),
      content_sequence: Number(reply.content_sequence),
      user: {
        nickname: String(reply.user_nickname ?? '익명'),
        profile_image: reply.user_profile_image ? String(reply.user_profile_image) : null,
      },
    })),
    replies: flattenedReplies.map((reply) => ({
      id: Number(reply.id),
      content_id: Number(reply.content_id),
      reply_id: reply.reply_id,
      content: String(reply.content),
      created_at: String(reply.created_at),
      depth: reply.depth,
      user: {
        nickname: String(reply.user_nickname ?? '익명'),
        profile_image: reply.user_profile_image ? String(reply.user_profile_image) : null,
      },
    })),
  };

  // 15. 템플릿 렌더링
  const html = renderTemplate(themeData.themeHtml, themeData.themeCss, templateData);

  // 16. 블로그 정보 구성
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
    <SafeBlogProvider blogId={Number(blog.id)} blogInfo={blogInfo}>
      <ContentStats contentId={content.id} userId={currentUser?.id} />
      <BlogLayout blogId={Number(blog.id)} html={String(html)} css={String(themeData.themeCss)} />
    </SafeBlogProvider>
  );
}
