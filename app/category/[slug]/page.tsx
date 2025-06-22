import { notFound } from 'next/navigation';

import BlogProvider from '../../../components/BlogProvider';
import BlogRenderer from '../../../components/BlogRenderer';
import { getCurrentUser } from '../../../lib/auth';
import { getBlogAddress } from '../../../lib/blogUtils';
import { getSidebarData } from '../../api/sidebarData';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getContentsByBlogId, getContentsByCategoryNameWithPaging } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
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

  const categories = await getCategoriesByBlogId(blog.id);
  const category = categories.find((c) => c.name === decodeURIComponent(slug));
  if (!category) notFound();

  const allContents = await getContentsByBlogId(blog.id, ownerUserId);
  const paginatedContents = await getContentsByCategoryNameWithPaging(blog.id, decodeURIComponent(slug), page, 10, ownerUserId);
  const menus = await getMenusByBlogId(blog.id);

  // 사이드바 데이터 불러오기 (app/page.tsx와 동일)
  const sidebarData = await getSidebarData(blog.id, ownerUserId);

  const templateData = {
    blog: {
      nickname: String(blog.nickname),
      description: blog.description ?? null,
      logo_image: blog.logo_image ?? null,
      address: String(blog.address),
      author: undefined,
    },
    categories: categories.map((cat) => ({
      id: Number(cat.id),
      name: String(cat.name),
      post_count: Number(cat.post_count),
      category_id: cat.category_id == null ? null : Number(cat.category_id),
    })),
    menus: menus.map((menu) => ({
      id: Number(menu.id),
      name: String(menu.name),
      type: String(menu.type),
      uri: String(menu.uri),
      is_blank: Boolean(menu.is_blank ?? false),
    })),
    // 전체 글 목록을 포함 (최근 글, 인기글 표시용)
    contents: allContents.map((content) => ({
      sequence: Number(content.sequence),
      title: String(content.title),
      content_html: String(content.content_html),
      content_plain: String(content.content_plain),
      created_at: String(content.created_at),
      thumbnail: content.thumbnail ?? undefined,
      category: content.category ? { id: Number(content.category.id), name: String(content.category.name) } : undefined,
      reply_count: Number(content.reply_count ?? 0),
    })),
    // 현재 카테고리의 글 목록 (메인 콘텐츠 표시용)
    categoryContents: paginatedContents.contents.map((content) => ({
      sequence: Number(content.sequence),
      title: String(content.title),
      content_html: String(content.content_html),
      content_plain: String(content.content_plain),
      created_at: String(content.created_at),
      thumbnail: content.thumbnail ?? undefined,
      category: content.category ? { id: Number(content.category.id), name: String(content.category.name) } : undefined,
      reply_count: Number(content.reply_count ?? 0),
    })),
    recentReplies: sidebarData.recentReplies,
    replies: [],
    pagination: paginatedContents.pagination,
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
    // 카테고리 페이지 전용 데이터
    currentCategoryName: category.name,
    isCategoryPage: true,
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
