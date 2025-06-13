import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { renderTemplate } from '../../../lib/template/TemplateEngine';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getContentByBlogIdAndSequence, getContentsByBlogId, getNextContent, getPrevContent } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';
import { getRecentReplies, getRepliesByContentId, Reply } from '../../api/tbReplies';
import { getActiveThemeByBlogId } from '../../api/tbThemes';
import BlogLayout from '../../components/BlogLayout';
import BlogProvider from '../../components/BlogProvider';

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

export default async function PostPage({ params }: { params: Promise<{ sequence: string }> }) {
  try {
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
    const theme = await getActiveThemeByBlogId(blog.id);
    if (!theme) {
      notFound();
    }

    // 5. 카테고리 정보 조회
    const categories = await getCategoriesByBlogId(blog.id);

    // 6. 글 내용 조회
    const content = await getContentByBlogIdAndSequence(blog.id, parseInt(resolvedParams.sequence));
    if (!content) {
      notFound();
    }

    // 7. 전체 글 목록 조회 (최근 글, 인기글 표시용)
    const allContents = await getContentsByBlogId(blog.id);

    // content_html이 비어있는 경우 처리
    if (!content.content_html || content.content_html.trim() === '') {
      // content_html이 비어있으면 content_plain을 사용하거나 기본 메시지 표시
      content.content_html = content.content_plain ? `<p>${content.content_plain}</p>` : '<p>내용이 없습니다.</p>';
    }

    // 8. 이전/다음 글 가져오기
    const prevContent = await getPrevContent(blog.id, parseInt(resolvedParams.sequence));
    const nextContent = await getNextContent(blog.id, parseInt(resolvedParams.sequence));

    // 9. 최근 댓글 조회
    const recentReplies = await getRecentReplies(blog.id);

    // 10. 해당 글의 댓글 조회
    const contentReplies = await getRepliesByContentId(content.id);

    // 10-1. 댓글을 계층 구조로 변환
    const hierarchicalReplies = buildReplyHierarchy(contentReplies);
    const flattenedReplies = flattenReplies(hierarchicalReplies);

    // 11. 메뉴 정보 조회
    const menus = await getMenusByBlogId(blog.id);

    // 12. 템플릿 데이터 구성
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
      // 개별 글 페이지용 데이터 추가
      currentArticle: {
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
      },
      recentReplies: recentReplies.map((reply) => ({
        id: Number(reply.id),
        content_id: Number(reply.content_id),
        content: String(reply.content),
        created_at: String(reply.created_at),
        content_sequence: Number(reply.content_sequence),
        user: { nickname: String(reply.user_nickname ?? '익명') },
      })),
      replies: flattenedReplies.map((reply) => ({
        id: Number(reply.id),
        content_id: Number(reply.content_id),
        reply_id: reply.reply_id,
        content: String(reply.content),
        created_at: String(reply.created_at),
        depth: reply.depth,
        user: { nickname: String(reply.user_nickname ?? '익명') },
      })),
    };

    // 13. 템플릿 렌더링
    const html = renderTemplate(theme.html, theme.css, templateData);

    // 14. 블로그 정보 구성
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
    // 에러 발생 시 404 페이지로 리다이렉션
    notFound();
  }
}
