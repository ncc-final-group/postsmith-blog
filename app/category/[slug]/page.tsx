import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import BlogLayout from '../../../components/BlogLayout';
import BlogProvider from '../../../components/BlogProvider';
import { getCurrentUser } from '../../../lib/auth';
import { renderTemplate } from '../../../lib/template/TemplateEngine';
import { getThemeByBlogId } from '../../../lib/themeService';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getContentsByBlogId, getContentsByCategoryNameWithPaging } from '../../api/tbContents';
import { getMenusByBlogId } from '../../api/tbMenu';
import { getRecentReplies } from '../../api/tbReplies';

async function getSubdomain(): Promise<string> {
  const h = await headers();
  const host = h.get('host') || 'localhost:3000';
  if (host.includes('.localhost')) return host.split('.localhost')[0];
  if (host.includes('.')) return host.split('.')[0];
  return 'testblog';
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const sub = await getSubdomain();
  const blog = await getBlogByAddress(sub);
  if (!blog) notFound();
  const themeData = await getThemeByBlogId(blog.id);
  if (!themeData) notFound();

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
  const recentReplies = await getRecentReplies(blog.id);
  const menus = await getMenusByBlogId(blog.id);

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
      is_blank: Boolean(menu.is_blank),
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
    recentReplies: recentReplies.map((r) => ({
      id: Number(r.id),
      content_id: Number(r.content_id),
      content: String(r.content),
      created_at: String(r.created_at),
      content_sequence: Number(r.content_sequence),
      user: { nickname: String(r.user_nickname ?? '익명') },
    })),
    replies: [],
    pagination: paginatedContents.pagination, // 페이지네이션 정보 추가
  };

  const html = renderTemplate(themeData.themeHtml, themeData.themeCss, templateData);

  // 카테고리 헤더 삽입
  const headerBlock = `
    <section class="category-header container mx-auto py-8">
      <h1 class="text-3xl font-bold mb-2">${category.name}</h1>
      <p class="text-gray-600">${paginatedContents.pagination.totalContents}개의 글</p>
    </section>
  `;

  // 첫 <main> 태그 앞에 헤더 블록 추가
  const finalHtml = html.replace('<main', `${headerBlock}<main`);

  const blogInfo = {
    id: blog.id,
    nickname: blog.nickname,
    description: blog.description,
    logo_image: blog.logo_image,
    address: blog.address,
  };

  return (
    <BlogProvider blogId={blog.id} blogInfo={blogInfo}>
      <BlogLayout blogId={blog.id} html={String(finalHtml)} css={String(themeData.themeCss)} />
    </BlogProvider>
  );
}
