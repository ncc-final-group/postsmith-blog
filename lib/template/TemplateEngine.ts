export interface TemplateContext {
  tokens: Record<string, string | number>;
  repeaters: Record<string, Record<string, string | number>[]>;
}

interface TemplateData {
  blog: {
    title: string;
    description: string | null;
    profile_image: string | null;
    address: string;
  };
  categories: Array<{
    id: number;
    name: string;
    post_count: number;
  }>;
  contents: Array<{
    id: number;
    title: string;
    content_html: string;
    content_plain: string;
    created_at: string;
    thumbnail?: string;
    category?: {
      id: number;
      name: string;
    };
    reply_count: number;
  }>;
  recentReplies: Array<{
    id: number;
    content_id: number;
    content_plain: string;
    created_at: string;
    user: {
      nickname: string;
    };
  }>;
}

export class TemplateEngine {
  private static T3_SCRIPT = `<script type="text/javascript" src="https://t1.daumcdn.net/tistory_admin/blogs/script/blog/common.js"></script>\n  <div style="margin:0; padding:0; border:none; background:none; float:none; clear:none; z-index:0"></div>`;

  private replaceTokens(html: string, tokens: Record<string, string | number>): string {
    return Object.entries(tokens).reduce((acc, [token, value]) => {
      return acc.replace(new RegExp(token, 'g'), String(value));
    }, html);
  }

  private processRepeater(html: string, tag: string, items: Record<string, string | number>[]): string {
    const startTag = `<s_${tag}>`;
    const endTag = `</s_${tag}>`;
    
    const startIndex = html.indexOf(startTag);
    const endIndex = html.indexOf(endTag);
    
    if (startIndex === -1 || endIndex === -1) {
      return html;
    }
    
    const before = html.substring(0, startIndex);
    const template = html.substring(startIndex + startTag.length, endIndex);
    const after = html.substring(endIndex + endTag.length);
    
    const repeatedContent = items.map(item => this.replaceTokens(template, item)).join('');
    
    return before + repeatedContent + after;
  }

  public process(html: string, context: TemplateContext): string {
    let result = html;
    
    // Replace tokens
    if (context.tokens) {
      result = this.replaceTokens(result, context.tokens);
    }
    
    // Process repeaters
    if (context.repeaters) {
      result = Object.entries(context.repeaters).reduce((acc, [tag, items]) => {
        return this.processRepeater(acc, tag, items);
      }, result);
    }
    
    return result;
  }

  private replaceT3(template: string): string {
    return template.replace(/<s_t3>[\s\S]*?<\/s_t3>/gi, TemplateEngine.T3_SCRIPT);
  }

  private static replacePlaceholders(template: string, data: TemplateData): string {
    let result = template;

    // 기본 블로그 정보 치환
    result = result.replace(/\[##_title_##\]/g, data.blog.title);
    result = result.replace(/\[##_desc_##\]/g, data.blog.description || '');
    result = result.replace(/\[##_image_##\]/g, data.blog.profile_image || '');
    result = result.replace(/\[##_blog_link_##\]/g, `/${data.blog.address}`);
    result = result.replace(/\[##_blog_image_##\]/g, 
      data.blog.profile_image 
        ? `<img src="${data.blog.profile_image}" alt="${data.blog.title}" class="w-12 h-12 rounded-full" />`
        : ''
    );

    // 카테고리 목록 치환
    const categoriesHtml = data.categories
      .map(category => `
        <li>
          <a href="/category/${category.id}">
            ${category.name}
            <span class="post-count">(${category.post_count})</span>
          </a>
        </li>
      `)
      .join('');
    result = result.replace(/\[##_category_##\]/g, categoriesHtml);

    // 글 목록 치환
    const contentsHtml = data.contents
      .map(content => `
        <article class="post-card border-b py-6">
          <a href="/post/${content.id}" class="block hover:opacity-80">
            <h2 class="text-2xl font-semibold mb-2">${content.title}</h2>
            ${content.thumbnail ? `
              <img src="${content.thumbnail}" alt="thumbnail" class="w-full h-56 object-cover rounded" />
            ` : ''}
            <p class="text-sm text-gray-500 mt-2">
              <time datetime="${content.created_at}">${new Date(content.created_at).toLocaleDateString()}</time>
              ${content.category ? ` · <a href="/category/${content.category.id}">${content.category.name}</a>` : ''}
              · ${content.reply_count} 댓글
            </p>
            <p class="mt-4 text-gray-700 line-clamp-3">${content.content_plain}</p>
          </a>
        </article>
      `)
      .join('');
    result = result.replace(/<s_article_rep>[\s\S]*?<\/s_article_rep>/g, contentsHtml);

    // 최근 댓글 치환
    const repliesHtml = data.recentReplies
      .map(reply => `
        <li>
          <a href="/post/${reply.content_id}" class="block line-clamp-1">${reply.content_plain}</a>
          <span class="text-xs text-gray-500">${reply.user.nickname} · ${new Date(reply.created_at).toLocaleDateString()}</span>
        </li>
      `)
      .join('');
    result = result.replace(/<s_rctrp_rep>[\s\S]*?<\/s_rctrp_rep>/g, repliesHtml);

    // 티스토리 공통 JS 삽입 블록 제거
    result = result.replace(/<s_t3>[\s\S]*?<\/s_t3>/g, '');

    return result;
  }

  public static render(html: string, css: string, data: TemplateData): string {
    const processedHtml = this.replacePlaceholders(html, data);
    return processedHtml;
  }
} 