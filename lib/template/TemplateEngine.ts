export interface TemplateContext {
  tokens: Record<string, string | number>;
  repeaters: Record<string, Record<string, string | number>[]>;
}

interface TemplateData {
  blog: {
    nickname: string;
    description: string | null;
    logo_image: string | null;
    address: string;
    author?: string; // 블로그 작성자 추가
  };
  categories: Array<{
    id: number;
    name: string;
    post_count: number;
    category_id: number | null;
  }>;
  contents: Array<{
    sequence: number;
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
  // 카테고리 페이지용 필터링된 콘텐츠
  categoryContents?: Array<{
    sequence: number;
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
  // 개별 글 페이지용 데이터 추가
  currentArticle?: {
    sequence: number;
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
    author?: string;
    tags?: string[];
    prev_article?: {
      sequence: number;
      title: string;
    };
    next_article?: {
      sequence: number;
      title: string;
    };
  };
  recentReplies: Array<{
    id: number;
    content_id: number;
    content: string;
    created_at: string;
    content_sequence: number;
    user: {
      nickname: string;
    };
  }>;
  replies: Array<{
    id: number;
    content_id: number;
    content: string;
    created_at: string;
    user: {
      nickname: string;
    };
  }>;
}

const T3_SCRIPT = `<script type="text/javascript" src="https://t1.daumcdn.net/tistory_admin/blogs/script/blog/common.js"></script>
<div style="margin:0; padding:0; border:none; background:none; float:none; clear:none; z-index:0"></div>`;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${year}.${month}.${day} ${hour}:${minute}`;
}

function getDateYear(dateString: string): string {
  const date = new Date(dateString);
  return date.getFullYear().toString();
}

function getDateMonth(dateString: string): string {
  const date = new Date(dateString);
  return (date.getMonth() + 1).toString().padStart(2, '0');
}

function getDateDay(dateString: string): string {
  const date = new Date(dateString);
  return date.getDate().toString().padStart(2, '0');
}

function getDateTime(dateString: string): string {
  const date = new Date(dateString);
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');

  return `${hour}:${minute}`;
}

function formatSimpleDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  });
}

function replaceTokens(html: string, tokens: Record<string, string | number>): string {
  return Object.entries(tokens).reduce((acc, [token, value]) => {
    return acc.replace(new RegExp(token, 'g'), String(value));
  }, html);
}

function processRepeater(html: string, tag: string, items: Record<string, string | number>[]): string {
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

  const repeatedContent = items.map((item) => replaceTokens(template, item)).join('');

  return before + repeatedContent + after;
}

function process(html: string, context: TemplateContext): string {
  let result = html;

  // Replace tokens
  if (context.tokens) {
    result = replaceTokens(result, context.tokens);
  }

  // Process repeaters
  if (context.repeaters) {
    result = Object.entries(context.repeaters).reduce((acc, [tag, items]) => {
      return processRepeater(acc, tag, items);
    }, result);
  }

  return result;
}

function replaceT3(template: string): string {
  return template.replace(/<s_t3>[\s\S]*?<\/s_t3>/gi, T3_SCRIPT);
}

function replacePlaceholders(template: string, data: TemplateData): string {
  let result = template;

  // 기본 블로그 정보 치환 (예시와 동일한 방식)
  result = result
    .replace(/\[##_page_title_##\]/g, data.blog.nickname || '블로그')
    .replace(/\[##_title_##\]/g, data.blog.nickname || '블로그')
    .replace(/\[##_desc_##\]/g, data.blog.description || '')
    .replace(/\[##_image_##\]/g, data.blog.logo_image || '')
    .replace(/\[##_blog_link_##\]/g, `/`)
    .replace(/\[##_body_id_##\]/g, 'tt-body-index');

  // 블로그 이미지 치환
  result = result.replace(/\[##_blog_image_##\]/g, data.blog.logo_image ? `<img src="${data.blog.logo_image}" alt="${data.blog.nickname}" class="blog-logo" />` : '');

  // 블로그 메뉴 치환 (기본 메뉴)
  const blogMenuHtml = `
    <ul>
      <li><a href="/">홈</a></li>
      <li><a href="/about">소개</a></li>
      <li><a href="/contact">연락처</a></li>
    </ul>
  `;
  result = result.replace(/\[##_blog_menu_##\]/g, blogMenuHtml);

  // 계층형 카테고리 HTML 생성
  const buildCategoryList = (parentId: number | null, depth = 0): string => {
    return data.categories
      .filter((cat) => (cat.category_id ?? null) == parentId)
      .map((cat) => {
        const prefix = depth > 0 ? '&nbsp;&nbsp;- ' : '';
        const current = `
        <li>
              <a href="/category/${encodeURIComponent(cat.name)}" class="${depth > 0 ? 'sub-cat' : ''}">
                ${prefix}${cat.name}
                <span class="cnt">${cat.post_count}</span>
          </a>
        </li>
          `;
        const children = buildCategoryList(cat.id, depth + 1);
        return current + children;
      })
      .join('');
  };

  const categoriesHtml = `<ul>${buildCategoryList(null)}</ul>`;
  result = result.replace(/\[##_category_##\]/g, categoriesHtml);

  // 글 목록 반복 블록 처리 - 개별 글 페이지가 아닐 때만 처리
  if (!data.currentArticle) {
    const articleRepPattern = /<s_article_rep>([\s\S]*?)<\/s_article_rep>/g;
    let articlesHtml = '';
    // 카테고리 페이지에서는 categoryContents 사용, 그 외에는 contents 사용
    const contentsToShow = data.categoryContents || data.contents;
    contentsToShow.forEach((content) => {
      const articleTemplate = result.match(articleRepPattern)?.[0]?.replace(/<\/?s_article_rep>/g, '') || '';
      if (articleTemplate) {
        // 글 목록에서는 제목을 단순 텍스트로 표시 (Editor 스타일 적용 안함)
        let articleHtml = articleTemplate
          .replace(/\[##_article_rep_link_##\]/g, `/posts/${content.sequence}`)
          .replace(/\[##_article_rep_title_##\]/g, content.title)
          .replace(/\[##_article_rep_date_##\]/g, content.created_at)
          .replace(/\[##_article_rep_simple_date_##\]/g, formatSimpleDate(content.created_at))
          .replace(/\[##_article_rep_date_year_##\]/g, getDateYear(content.created_at))
          .replace(/\[##_article_rep_date_month_##\]/g, getDateMonth(content.created_at))
          .replace(/\[##_article_rep_date_day_##\]/g, getDateDay(content.created_at))
          .replace(/\[##_article_rep_time_##\]/g, getDateTime(content.created_at))
          .replace(/\[##_article_rep_desc_##\]/g, content.content_plain.substring(0, 150) + '...')
          .replace(/\[##_article_rep_rp_cnt_##\]/g, String(content.reply_count));

        // 카테고리 관련 치환자
        if (content.category) {
          articleHtml = articleHtml
            .replace(/\[##_article_rep_category_link_##\]/g, `/category/${content.category.name}`)
            .replace(/\[##_article_rep_category_##\]/g, content.category.name);
        } else {
          articleHtml = articleHtml.replace(/\[##_article_rep_category_link_##\]/g, '#').replace(/\[##_article_rep_category_##\]/g, '미분류');
        }

        // 썸네일 처리
        if (content.thumbnail) {
          articleHtml = articleHtml.replace(/\[##_article_rep_thumbnail_url_##\]/g, content.thumbnail);
          articleHtml = articleHtml.replace(/<s_article_rep_thumbnail>([\s\S]*?)<\/s_article_rep_thumbnail>/g, '$1');
        } else {
          articleHtml = articleHtml.replace(/<s_article_rep_thumbnail>[\s\S]*?<\/s_article_rep_thumbnail>/g, '');
        }

        // 댓글 수 처리
        if (content.reply_count > 0) {
          articleHtml = articleHtml.replace(/<s_rp_count>([\s\S]*?)<\/s_rp_count>/g, '$1');
        } else {
          articleHtml = articleHtml.replace(/<s_rp_count>[\s\S]*?<\/s_rp_count>/g, '');
        }

        articlesHtml += articleHtml;
      }
    });
    result = result.replace(articleRepPattern, articlesHtml);
  } else {
    // 개별 글 페이지에서는 글 목록 블록 제거
    result = result.replace(/<s_article_rep>[\s\S]*?<\/s_article_rep>/g, '');
  }

  // 최근 글 반복 블록 처리 (예시와 동일한 방식)
  const recentPostsPattern = /<s_rctps_rep>([\s\S]*?)<\/s_rctps_rep>/g;
  let recentPostsHtml = '';
  data.contents.slice(0, 5).forEach((content) => {
    const recentTemplate = result.match(recentPostsPattern)?.[0]?.replace(/<\/?s_rctps_rep>/g, '') || '';
    if (recentTemplate) {
      // 최근 글 목록에서는 제목을 단순 텍스트로 표시 (Editor 스타일 적용 안함)
      let recentHtml = recentTemplate
        .replace(/\[##_rctps_rep_link_##\]/g, `/posts/${content.sequence}`)
        .replace(/\[##_rctps_rep_title_##\]/g, content.title)
        .replace(/\[##_rctps_rep_rp_cnt_##\]/g, String(content.reply_count));

      // 썸네일 처리
      if (content.thumbnail) {
        recentHtml = recentHtml.replace(/\[##_rctps_rep_thumbnail_##\]/g, content.thumbnail);
        recentHtml = recentHtml.replace(/<s_rctps_rep_thumbnail>([\s\S]*?)<\/s_rctps_rep_thumbnail>/g, '$1');
      } else {
        recentHtml = recentHtml.replace(/<s_rctps_rep_thumbnail>[\s\S]*?<\/s_rctps_rep_thumbnail>/g, '');
      }

      recentPostsHtml += recentHtml;
    }
  });
  result = result.replace(recentPostsPattern, recentPostsHtml);

  // 인기 글 반복 블록 처리 (댓글 수 기준 상위 5개)
  const popularPattern = /<s_rctps_popular_rep>([\s\S]*?)<\/s_rctps_popular_rep>/g;
  let popularHtml = '';
  const popularContents = [...data.contents].sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0)).slice(0, 5);

  popularContents.forEach((content) => {
    const popTemplate = result.match(popularPattern)?.[0]?.replace(/<\/?s_rctps_popular_rep>/g, '') || '';
    if (popTemplate) {
      let pHtml = popTemplate
        .replace(/\[##_rctps_rep_link_##\]/g, `/posts/${content.sequence}`)
        .replace(/\[##_rctps_rep_title_##\]/g, content.title)
        .replace(/\[##_rctps_rep_rp_cnt_##\]/g, String(content.reply_count ?? 0))
        .replace(/\[##_rctps_rep_author_##\]/g, '')
        .replace(/\[##_rctps_rep_date_##\]/g, formatDateTime(content.created_at))
        .replace(/\[##_rctps_rep_simple_date_##\]/g, formatSimpleDate(content.created_at));

      // 카테고리
      if (content.category) {
        pHtml = pHtml.replace(/\[##_rctps_rep_category_link_##\]/g, `/category/${content.category.name}`).replace(/\[##_rctps_rep_category_##\]/g, content.category.name);
      } else {
        pHtml = pHtml.replace(/\[##_rctps_rep_category_link_##\]/g, '#').replace(/\[##_rctps_rep_category_##\]/g, '미분류');
      }

      // 썸네일
      if (content.thumbnail) {
        pHtml = pHtml.replace(/\[##_rctps_rep_thumbnail_##\]/g, content.thumbnail);
        pHtml = pHtml.replace(/<s_rctps_rep_thumbnail>([\s\S]*?)<\/s_rctps_rep_thumbnail>/g, '$1');
      } else {
        pHtml = pHtml.replace(/<s_rctps_rep_thumbnail>[\s\S]*?<\/s_rctps_rep_thumbnail>/g, '');
      }

      popularHtml += pHtml;
    }
  });
  result = result.replace(popularPattern, popularHtml);

  // 최근 댓글 반복 블록 처리 (예시와 동일한 방식)
  const recentRepliesPattern = /<s_rctrp_rep>([\s\S]*?)<\/s_rctrp_rep>/g;
  let recentRepliesHtml = '';
  data.recentReplies.forEach((reply) => {
    const replyTemplate = result.match(recentRepliesPattern)?.[0]?.replace(/<\/?s_rctrp_rep>/g, '') || '';
    if (replyTemplate) {
      let replyHtml = replyTemplate
        .replace(/\[##_rctrp_rep_link_##\]/g, `/posts/${reply.content_sequence}`)
        .replace(/\[##_rctrp_rep_desc_##\]/g, reply.content.substring(0, 50) + '...')
        .replace(/\[##_rctrp_rep_name_##\]/g, reply.user.nickname)
        .replace(/\[##_rctrp_rep_time_##\]/g, formatSimpleDate(reply.created_at));

      recentRepliesHtml += replyHtml;
    }
  });
  result = result.replace(recentRepliesPattern, recentRepliesHtml);

  // 댓글 리스트 반복 블록 처리 (개별 글 페이지용)
  const repliesPattern = /\[##_rp_rep_##\]([\s\S]*?)\[\/##_rp_rep_##\]/g;
  let repliesHtml = '';
  data.replies.forEach((reply) => {
    const replyTemplate = result.match(repliesPattern)?.[0]?.replace(/\[##_rp_rep_##\]|\[\/##_rp_rep_##\]/g, '') || '';
    if (replyTemplate) {
      let replyHtml = replyTemplate
        .replace(/\[##_rp_rep_id_##\]/g, String(reply.id))
        .replace(/\[##_rp_rep_name_##\]/g, reply.user.nickname)
        .replace(/\[##_rp_rep_content_##\]/g, reply.content)
        .replace(/\[##_rp_rep_date_##\]/g, formatDateTime(reply.created_at))
        .replace(/\[##_rp_rep_time_##\]/g, formatSimpleDate(reply.created_at))
        .replace(/\[##_rp_rep_link_##\]/g, `#reply-${reply.id}`);

      repliesHtml += replyHtml;
    }
  });
  result = result.replace(repliesPattern, repliesHtml);

  // 댓글 개수 치환
  result = result.replace(/\[##_article_rep_rp_cnt_##\]/g, String(data.replies.length));
  result = result.replace(/\[##_rp_count_##\]/g, String(data.replies.length));

  // 댓글 관련 기본 치환자
  result = result.replace(
    /\[##_rp_input_form_##\]/g,
    `
    <div class="comment-form">
      <form>
        <div class="form-group">
          <label for="comment-name">이름:</label>
          <input type="text" id="comment-name" name="name" required>
        </div>
        <div class="form-group">
          <label for="comment-content">댓글:</label>
          <textarea id="comment-content" name="content" rows="4" required></textarea>
        </div>
        <button type="submit">댓글 작성</button>
      </form>
    </div>
  `,
  );

  // 개별 글 페이지 관련 치환자 처리
  if (data.currentArticle) {
    const article = data.currentArticle;

    // s_article_protected 블록 처리 - 개별 글 페이지에서만 표시
    result = result.replace(/<s_article_protected>([\s\S]*?)<\/s_article_protected>/g, '$1');

    // 1. 글의 고유 링크
    result = result.replace(/\[##_article_permalink_##\]/g, `/posts/${article.sequence}`);

    // 2. 개별 글 제목 - editor-content 클래스 추가하여 Editor 스타일 적용
    // 제목이 이미 HTML 태그를 포함하고 있는지 확인
    const isHtmlTitle = article.title.includes('<') && article.title.includes('>');
    const titleHtml = isHtmlTitle ? article.title : article.title; // 템플릿에서 이미 h1 태그로 감싸져 있음

    result = result.replace(/\[##_article_title_##\]/g, titleHtml);

    // 3. 글 내용 (HTML) - editor-content 클래스 추가
    result = result.replace(/\[##_article_content_##\]/g, article.content_html);

    // 4. 글 작성일 (날짜 + 시간)
    result = result.replace(/\[##_article_date_##\]/g, formatDateTime(article.created_at));

    // 개별 날짜/시간 치환자들
    result = result.replace(/\[##_article_date_year_##\]/g, getDateYear(article.created_at));
    result = result.replace(/\[##_article_date_month_##\]/g, getDateMonth(article.created_at));
    result = result.replace(/\[##_article_date_day_##\]/g, getDateDay(article.created_at));
    result = result.replace(/\[##_article_time_##\]/g, getDateTime(article.created_at));

    // 5. 글 작성자
    result = result.replace(/\[##_article_author_##\]/g, article.author || data.blog.author || '익명');

    // 6. 글 카테고리
    if (article.category) {
      result = result.replace(/\[##_article_category_##\]/g, article.category.name);
    } else {
      result = result.replace(/\[##_article_category_##\]/g, '미분류');
    }

    // 7. 글 태그 (미구현이므로 빈 문자열)
    result = result.replace(/\[##_article_tags_##\]/g, '');

    // 8. 이전 글
    if (article.prev_article) {
      result = result.replace(/\[##_article_prev_##\]/g, `<a href="/posts/${article.prev_article.sequence}" title="${article.prev_article.title}">이전 글</a>`);
    } else {
      result = result.replace(/\[##_article_prev_##\]/g, '');
    }

    // 9. 다음 글
    if (article.next_article) {
      result = result.replace(/\[##_article_next_##\]/g, `<a href="/posts/${article.next_article.sequence}" title="${article.next_article.title}">다음 글</a>`);
    } else {
      result = result.replace(/\[##_article_next_##\]/g, '');
    }
  } else {
    // 개별 글 페이지가 아닌 경우 s_article_protected 블록 제거
    result = result.replace(/<s_article_protected>[\s\S]*?<\/s_article_protected>/g, '');

    // 개별 글 페이지가 아닌 경우 빈 문자열로 치환
    result = result
      .replace(/\[##_article_permalink_##\]/g, '')
      .replace(/\[##_article_title_##\]/g, '')
      .replace(/\[##_article_content_##\]/g, '')
      .replace(/\[##_article_date_##\]/g, '')
      .replace(/\[##_article_date_year_##\]/g, '')
      .replace(/\[##_article_date_month_##\]/g, '')
      .replace(/\[##_article_date_day_##\]/g, '')
      .replace(/\[##_article_time_##\]/g, '')
      .replace(/\[##_article_author_##\]/g, '')
      .replace(/\[##_article_category_##\]/g, '')
      .replace(/\[##_article_tags_##\]/g, '')
      .replace(/\[##_article_prev_##\]/g, '')
      .replace(/\[##_article_next_##\]/g, '');
  }

  // 사이드바 블록 처리
  result = result.replace(/<s_sidebar>([\s\S]*?)<\/s_sidebar>/g, '$1');
  result = result.replace(/<s_sidebar_element>([\s\S]*?)<\/s_sidebar_element>/g, '$1');

  // 티스토리 공통 JS 삽입 블록 치환
  result = result.replace(/<s_t3>[\s\S]*?<\/s_t3>/g, T3_SCRIPT);

  return result;
}

function normalizeHtml(html: string): string {
  return (
    html
      // DOCTYPE과 html 태그 제거
      .replace(/<!DOCTYPE[^>]*>/g, '')
      .replace(/<html[^>]*>/g, '')
      .replace(/<\/html>/g, '')
      // head 태그와 내용 제거
      .replace(/<head[^>]*>[\s\S]*?<\/head>/g, '')
      // body 태그 제거 (id 속성 유지)
      .replace(/<body[^>]*>/g, '<div>')
      .replace(/<\/body>/g, '</div>')
      // 앞뒤 공백만 제거 (HTML 구조는 유지)
      .trim()
  );
}

export function renderTemplate(html: string, css: string, data: TemplateData): string {
  const processedHtml = replacePlaceholders(html, data);
  const normalizedHtml = normalizeHtml(processedHtml);
  return normalizedHtml;
}
