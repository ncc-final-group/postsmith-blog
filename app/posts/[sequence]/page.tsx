import { getBlogByAddress } from '../../api/tbBlogs';
import { getActiveThemeByBlogId } from '../../api/tbThemes';
import { getCategoriesByBlogId } from '../../api/tbCategories';
import { getContentBySequence } from '../../api/tbContents';
import { getRepliesByContentId } from '../../api/tbReplies';
import { TemplateEngine } from '../../../lib/template/TemplateEngine';
import BlogLayout from '../../components/BlogLayout';

export default async function PostPage({ 
  params 
}: { 
  params: { 
    sequence: string;
  } 
}) {
  // URL에서 subdomain 추출
  const host = process.env.HOST || 'localhost:3000';
  const subdomain = host.split('.')[0];

  // 블로그 정보 조회
  const blog = await getBlogByAddress(subdomain);
  if (!blog) {
    return new Response('Blog not found', { status: 404 });
  }

  const sequence = parseInt(params.sequence);

  // 테마 정보 조회
  const theme = await getActiveThemeByBlogId(blog.id);
  if (!theme) {
    return new Response('Theme not found', { status: 404 });
  }

  // 컨텐츠 정보 조회
  const content = await getContentBySequence(blog.id, sequence);
  if (!content) {
    return new Response('Content not found', { status: 404 });
  }

  // 카테고리 목록 조회
  const categories = await getCategoriesByBlogId(blog.id);

  // 댓글 목록 조회
  const replies = await getRepliesByContentId(content.id);

  // 템플릿 렌더링
  const html = TemplateEngine.render(theme.html, theme.css, {
    blog: {
      title: blog.title,
      description: blog.description,
      profile_image: blog.profile_image,
      address: blog.address
    },
    categories,
    contents: {
      id: content.id,
      title: content.title,
      content_html: content.content_html,
      content_plain: content.content_plain,
      created_at: content.created_at,
      thumbnail: content.thumbnail,
      category: content.category,
      reply_count: content.reply_count
    },
    replies
  });

  return <BlogLayout blogId={blog.id} html={html} css={theme.css} />;
} 