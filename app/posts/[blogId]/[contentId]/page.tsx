import { getBlogById } from '../../../api/tbBlogs';
import { getActiveThemeByBlogId } from '../../../api/tbThemes';
import { getCategoriesByBlogId } from '../../../api/tbCategories';
import { getContentById } from '../../../api/tbContents';
import { getRepliesByContentId } from '../../../api/tbReplies';
import { TemplateEngine } from '../../../../lib/template/TemplateEngine';

export default async function PostPage({ 
  params 
}: { 
  params: { 
    blogId: string;
    contentId: string;
  } 
}) {
  const blogId = parseInt(params.blogId);
  const contentId = parseInt(params.contentId);

  // 블로그 정보 조회
  const blog = await getBlogById(blogId);
  if (!blog) {
    return new Response('Blog not found', { status: 404 });
  }

  // 테마 정보 조회
  const theme = await getActiveThemeByBlogId(blogId);
  if (!theme) {
    return new Response('Theme not found', { status: 404 });
  }

  // 컨텐츠 정보 조회
  const content = await getContentById(contentId);
  if (!content || content.blog_id !== blogId) {
    return new Response('Content not found', { status: 404 });
  }

  // 카테고리 목록 조회
  const categories = await getCategoriesByBlogId(blogId);

  // 댓글 목록 조회
  const replies = await getRepliesByContentId(contentId);

  // 템플릿 렌더링
  const html = TemplateEngine.render(theme.html, theme.css, {
    blog: {
      title: blog.title,
      description: blog.description,
      profile_image: blog.profile_image,
      address: blog.address
    },
    categories,
    content: {
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

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
} 