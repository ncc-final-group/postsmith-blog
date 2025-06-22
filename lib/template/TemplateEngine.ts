/* eslint-disable indent */
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
  menus: Array<{
    id: number;
    name: string;
    type: string;
    uri: string;
    is_blank: boolean;
  }>;
  // 분류 없음 글 개수
  uncategorizedCount?: number;
  // 전체 글 개수 (페이징 고려)
  totalContentsCount?: number;
  contents: Array<{
    sequence: number;
    title: string;
    content_html: string;
    content_plain: string;
    created_at: string;
    type?: 'POSTS' | 'PAGE' | 'NOTICE'; // 콘텐츠 타입 추가
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
    type?: 'POSTS' | 'PAGE' | 'NOTICE'; // 콘텐츠 타입 추가
    thumbnail?: string;
    category?: {
      id: number;
      name: string;
    };
    reply_count: number;
  }>;
  // 인기글 데이터 (최근 한 달 기준: 댓글 수 + 방문자 수)
  popularContents?: Array<{
    sequence: number;
    title: string;
    content_id: number;
    recent_reply_count: number;
    recent_visit_count: number;
    popularity_score: number;
    created_at: string;
    content_html: string;
    content_plain: string;
    thumbnail?: string;
    category?: {
      id: number;
      name: string;
    };
    reply_count: number;
  }>;
  // 최근 글 데이터 (사이드바용)
  recentContents?: Array<{
    sequence: number;
    title: string;
    content_html: string;
    content_plain: string;
    created_at: string;
    type?: 'POSTS' | 'PAGE' | 'NOTICE'; // 콘텐츠 타입 추가
    thumbnail?: string;
    category?: {
      id: number;
      name: string;
    };
    reply_count: number;
  }>;
  // 개별 글 페이지용 데이터 추가
  currentArticle?: {
    id: number; // 실제 contents 테이블의 id (조회수용)
    sequence: number;
    title: string;
    content_html: string;
    content_plain: string;
    created_at: string;
    type?: 'POSTS' | 'PAGE' | 'NOTICE'; // 글 타입 추가
    thumbnail?: string;
    category?: {
      id: number;
      name: string;
    };
    reply_count: number;
    total_views?: number; // 총 조회수 추가
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
  // 페이지 타입 구분 (전체 글 목록 페이지인지 확인)
  isAllPostsPage?: boolean;
  // 카테고리 페이지 관련 정보
  isCategoryPage?: boolean;
  currentCategoryName?: string;
  // 페이징 정보
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalContents: number;
    hasNext: boolean;
    hasPrev: boolean;
    pageSize: number;
  };
  recentReplies: Array<{
    id: number;
    content_id: number;
    content: string;
    created_at: string;
    content_sequence: number;
    user: {
      nickname: string;
      profile_image?: string | null;
    };
  }>;
  replies: Array<{
    id: number;
    content_id: number;
    reply_id?: number | null;
    content: string;
    created_at: string;
    depth?: number;
    user: {
      nickname: string;
      profile_image?: string | null;
    };
  }>;
}

const T3_SCRIPT = `<script type=""></script>
<div style="margin:0; padding:0; border:none; background:none; float:none; clear:none; z-index:0"></div>`;

// PostSmith 테마 JavaScript 코드
const POSTSMITH_THEME_SCRIPT = `
<script>
/**
 * PostSmith White Theme JavaScript
 * 모바일 메뉴 및 댓글 기능을 제공합니다.
 */
(function() {
  'use strict';

  let isInitialized = false;

  /**
   * 모바일 사이드바 토글 기능
   */
  function initMobileSidebar() {

    const toggleBtn = document.querySelector('.mobile-menu');
    const menu = document.querySelector('.menu');
    const overlay = document.querySelector('.menu-overlay');



    if (!toggleBtn || !menu || !overlay) {
      // 대안: 더 넓은 선택자로 시도
      const allButtons = document.querySelectorAll('button');
      const mobileMenuBtn = Array.from(allButtons).find(btn => 
        btn.classList.contains('mobile-menu') || 
        btn.getAttribute('aria-label')?.includes('메뉴')
      );
      
      if (mobileMenuBtn) {
        // 임시로 직접 이벤트 추가
        mobileMenuBtn.addEventListener('click', () => {
        });
      }
      
      return;
    }

    const toggleSidebar = () => {
      
      menu.classList.toggle('active');
      overlay.classList.toggle('active');
      toggleBtn.classList.toggle('open');
      
      // CSS가 제대로 적용되지 않는 경우 강제로 스타일 적용
      if (menu.classList.contains('active')) {
        if (window.getComputedStyle(menu).left === '-300px') {
          menu.style.left = '0px';
          overlay.style.opacity = '1';
          overlay.style.visibility = 'visible';
        }
      } else {
        menu.style.left = '';
        overlay.style.opacity = '';
        overlay.style.visibility = '';
      }

      if (menu.classList.contains('active')) {
        const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = scrollBarWidth + 'px';
      } else {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    };

    toggleBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);
  }

  /**
   * 댓글 기능 초기화
   */
  function initCommentFunctions() {
    // 답글 버튼 이벤트 리스너
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('reply-btn')) {
        const replyId = e.target.getAttribute('data-reply-id');
        if (replyId) {
          toggleReplyForm(replyId);
        }
      }
      
      if (e.target.classList.contains('reply-cancel-btn')) {
        const replyId = e.target.getAttribute('data-reply-id');
        if (replyId) {
          toggleReplyForm(replyId);
        }
      }
    });

    // 답글 폼 제출 이벤트 리스너
    document.addEventListener('submit', function(e) {
      if (e.target.classList.contains('reply-form')) {
        const replyId = e.target.getAttribute('data-reply-id');
        if (replyId) {
          handleReplySubmit(e, replyId);
        }
      }
    });
  }

  /**
   * 댓글 답글 폼 토글 함수
   */
  function toggleReplyForm(replyId) {
    const replyForm = document.getElementById('reply-form-' + replyId);
    if (replyForm) {
      replyForm.classList.toggle('hidden');
      if (!replyForm.classList.contains('hidden')) {
        const textarea = replyForm.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }
    }
  }

  /**
   * 답글 제출 핸들러
   */
  function handleReplySubmit(event, parentId) {
    event.preventDefault();
    const form = event.target;
    const content = form.querySelector('textarea').value.trim();

    if (!content) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    // 실제 답글 제출 로직은 서버사이드에서 처리
    // 여기서는 UI 피드백만 제공
    const submitBtn = form.querySelector('.reply-submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '제출 중...';
    submitBtn.disabled = true;

    // 실제 구현시에는 fetch API나 form 제출을 사용
    setTimeout(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      toggleReplyForm(parentId);
      form.reset();
      // 페이지 새로고침 또는 댓글 목록 업데이트
      window.location.reload();
    }, 1000);
  }

  /**
   * 초기화 함수
   */
  function init() {
    if (isInitialized) {
      return;
    }
    
    initMobileSidebar();
    initCommentFunctions();
    isInitialized = true;
  }

  // DOM이 로드되면 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 추가 안전장치: 다양한 시점에서 초기화 재시도
  setTimeout(() => {
    if (!isInitialized) init();
  }, 1000);

  setTimeout(() => {
    if (!isInitialized) init();
  }, 2000);
})();
</script>
`;

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

  // 블로그 메뉴 치환 (데이터베이스에서 가져온 메뉴)
  const blogMenuHtml =
    data.menus.length > 0
      ? `
    <ul>
      ${data.menus
        .map((menu) => {
          const target = menu.is_blank ? ' target="_blank"' : '';
          return `<li><a href="${menu.uri}"${target}>${menu.name}</a></li>`;
        })
        .join('')}
    </ul>
  `
      : `
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

  // 카테고리 반복 블록 처리 (계층형 구조 지원)
  const categoryRepPattern = /<s_category_rep>([\s\S]*?)<\/s_category_rep>/g;
  let categoryRepHtml = '';

  // 계층형 카테고리 순회 함수
  const buildCategoryRepList = (parentId: number | null, depth = 0): string => {
    let html = '';
    data.categories
      .filter((cat) => (cat.category_id ?? null) === parentId)
      .forEach((category) => {
        const categoryTemplate = result.match(categoryRepPattern)?.[0]?.replace(/<\/?s_category_rep>/g, '') || '';
        if (categoryTemplate) {
          // 깊이에 따른 들여쓰기 표시
          const indentPrefix = depth > 0 ? '&nbsp;&nbsp;'.repeat(depth) + '- ' : '';
          const depthClass = depth > 0 ? ' sub-cat' : '';

          let catHtml = categoryTemplate
            .replace(/\[##_category_name_##\]/g, indentPrefix + category.name)
            .replace(/\[##_category_count_##\]/g, String(category.post_count))
            .replace(/\[##_category_link_##\]/g, `/category/${encodeURIComponent(category.name)}`)
            .replace(/class="block py-1"/g, `class="block py-1${depthClass}"`);

          html += catHtml;

          // 하위 카테고리 재귀 처리
          html += buildCategoryRepList(category.id, depth + 1);
        }
      });
    return html;
  };

  categoryRepHtml = buildCategoryRepList(null);
  result = result.replace(categoryRepPattern, categoryRepHtml);

  // 모바일 메뉴용 카테고리 목록
  const buildMobileCategoryList = (parentId: number | null, depth = 0): string => {
    return data.categories
      .filter((cat) => (cat.category_id ?? null) == parentId)
      .map((cat) => {
        const prefix = depth > 0 ? '&nbsp;&nbsp;- ' : '';
        const current = `<li><a href="/category/${encodeURIComponent(cat.name)}" class="block py-1${depth > 0 ? ' sub-cat' : ''}">${prefix}${cat.name} (${cat.post_count})</a></li>`;
        const children = buildMobileCategoryList(cat.id, depth + 1);
        return current + children;
      })
      .join('');
  };

  const mobileCategoriesHtml = buildMobileCategoryList(null);
  result = result.replace(/\[##_mobile_categories_##\]/g, mobileCategoriesHtml);

  // 모바일 메뉴용 분류 없음 링크
  const mobileUncategorizedHtml =
    data.uncategorizedCount && data.uncategorizedCount > 0
      ? `<li><a href="/category/uncategorized" class="uncategorized-link block py-1">분류 없음 (${data.uncategorizedCount})</a></li>`
      : '';
  result = result.replace(/\[##_mobile_uncategorized_##\]/g, mobileUncategorizedHtml);

  // 모바일 메뉴용 사용자 정의 메뉴
  const mobileMenuHtml = data.menus
    .map((menu) => {
      const target = menu.is_blank ? ' target="_blank"' : '';
      return `<li><a href="${menu.uri}"${target}>${menu.name}</a></li>`;
    })
    .join('');
  result = result.replace(/\[##_mobile_menu_##\]/g, mobileMenuHtml);

  // 전체 글 개수 치환자 추가
  const totalCount = data.pagination?.totalContents || data.totalContentsCount || data.contents.length;
  result = result.replace(/\[##_count_total_##\]/g, String(totalCount));

  // 카테고리 페이지 관련 치환자
  if (data.isCategoryPage && data.currentCategoryName) {
    result = result.replace(/\[##_current_category_name_##\]/g, data.currentCategoryName);
    result = result.replace(/\[##_category_page_title_##\]/g, `${data.currentCategoryName} 카테고리`);
    result = result.replace(/\[##_page_header_title_##\]/g, `${data.currentCategoryName} <span class="text-lg text-gray-600">(${totalCount})</span>`);
  } else {
    result = result.replace(/\[##_current_category_name_##\]/g, '');
    result = result.replace(/\[##_category_page_title_##\]/g, '');
    result = result.replace(/\[##_page_header_title_##\]/g, `전체 글 <span class="text-lg text-gray-600">(${totalCount})</span>`);
  }

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
        // 타입에 따라 다른 링크 생성
        let linkUrl = `/posts/${content.sequence}`;
        if (content.type === 'NOTICE') {
          linkUrl = `/notices/${encodeURIComponent(content.title)}`;
        } else if (content.type === 'PAGE') {
          linkUrl = `/pages/${encodeURIComponent(content.title)}`;
        }

        let articleHtml = articleTemplate
          .replace(/\[##_article_rep_link_##\]/g, linkUrl)
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
          // 타입에 따라 기본 카테고리명 설정 (content에 type이 있다면)
          let defaultCategory = '미분류';
          if ((content as any).type === 'PAGE') {
            defaultCategory = '페이지';
          } else if ((content as any).type === 'NOTICE') {
            defaultCategory = '공지';
          }
          articleHtml = articleHtml.replace(/\[##_article_rep_category_link_##\]/g, '#').replace(/\[##_article_rep_category_##\]/g, defaultCategory);
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
  (data.recentContents || data.contents.slice(0, 5)).forEach((content) => {
    const recentTemplate = result.match(recentPostsPattern)?.[0]?.replace(/<\/?s_rctps_rep>/g, '') || '';
    if (recentTemplate) {
      // 최근 글 목록에서는 제목을 단순 텍스트로 표시 (Editor 스타일 적용 안함)
      // 타입에 따라 다른 링크 생성
      let linkUrl = `/posts/${content.sequence}`;
      if (content.type === 'NOTICE') {
        linkUrl = `/notices/${encodeURIComponent(content.title)}`;
      } else if (content.type === 'PAGE') {
        linkUrl = `/pages/${encodeURIComponent(content.title)}`;
      }

      let recentHtml = recentTemplate
        .replace(/\[##_rctps_rep_link_##\]/g, linkUrl)
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
  const popularContents =
    data.popularContents && data.popularContents.length > 0
      ? data.popularContents.slice(0, 5)
      : [...data.contents].sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0)).slice(0, 5);

  popularContents.forEach((content) => {
    const popTemplate = result.match(popularPattern)?.[0]?.replace(/<\/?s_rctps_popular_rep>/g, '') || '';
    if (popTemplate) {
      // 타입에 따라 다른 링크 생성
      let linkUrl = `/posts/${content.sequence}`;
      if ((content as any).type === 'NOTICE') {
        linkUrl = `/notices/${encodeURIComponent(content.title)}`;
      } else if ((content as any).type === 'PAGE') {
        linkUrl = `/pages/${encodeURIComponent(content.title)}`;
      }

      let pHtml = popTemplate
        .replace(/\[##_rctps_rep_link_##\]/g, linkUrl)
        .replace(/\[##_rctps_rep_title_##\]/g, content.title)
        .replace(/\[##_rctps_rep_rp_cnt_##\]/g, String(content.reply_count ?? 0))
        .replace(/\[##_rctps_rep_author_##\]/g, '')
        .replace(/\[##_rctps_rep_date_##\]/g, formatDateTime(content.created_at))
        .replace(/\[##_rctps_rep_simple_date_##\]/g, formatSimpleDate(content.created_at));

      // 카테고리
      if (content.category) {
        pHtml = pHtml.replace(/\[##_rctps_rep_category_link_##\]/g, `/category/${content.category.name}`).replace(/\[##_rctps_rep_category_##\]/g, content.category.name);
      } else {
        // 타입에 따라 기본 카테고리명 설정
        let defaultCategory = '미분류';
        if ((content as any).type === 'PAGE') {
          defaultCategory = '페이지';
        } else if ((content as any).type === 'NOTICE') {
          defaultCategory = '공지';
        }
        pHtml = pHtml.replace(/\[##_rctps_rep_category_link_##\]/g, '#').replace(/\[##_rctps_rep_category_##\]/g, defaultCategory);
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
    let replyTemplate = result.match(repliesPattern)?.[0]?.replace(/\[##_rp_rep_##\]|\[\/##_rp_rep_##\]/g, '') || '';

    // 기본 댓글 템플릿이 없는 경우 기본 구조 제공
    if (!replyTemplate.trim()) {
      replyTemplate = `
        <div class="comment-item" style="[##_rp_rep_indent_style_##]">
          <div class="comment-profile">
            [##_rp_rep_profile_image_##]
          </div>
          <div class="comment-body">
            <div class="comment-meta">
              <span class="comment-author">[##_rp_rep_name_##]</span>
              <span class="comment-date">[##_rp_rep_time_##]</span>
            </div>
            <div class="comment-content">[##_rp_rep_content_##]</div>
            <div class="comment-actions">[##_rp_rep_reply_button_##]</div>
          </div>
        </div>
      `;
    }

    if (replyTemplate) {
      // depth에 따른 들여쓰기 계산 (각 레벨당 20px)
      const depth = reply.depth ?? 0;
      const indentStyle = depth > 0 ? `margin-left: ${depth * 20}px; padding-left: 15px; border-left: 2px solid #e5e7eb;` : '';

      // depth에 따른 CSS 클래스 생성
      let depthClass = '';
      if (depth > 0) {
        depthClass = depth <= 3 ? `reply-depth-${depth}` : 'reply-depth-3';
      }

      // 답글 버튼 HTML 생성 (depth 3 이하일 때만 표시)
      const replyButtonHtml =
        depth < 3
          ? `<button onclick="replyToComment(${reply.id})" style="background: #f8f9fa; border: 1px solid #dee2e6; color: #6c757d; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px; margin-left: 10px;">답글</button>`
          : '';

      // 프로필 이미지 HTML 생성
      const profileImageHtml =
        reply.user.profile_image && reply.user.profile_image.trim() !== ''
          ? `<img src="${reply.user.profile_image}" alt="프로필" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
          : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
             <span style="color: white; font-weight: bold; font-size: 14px;">${reply.user.nickname ? reply.user.nickname.charAt(0).toUpperCase() : 'U'}</span>
           </div>`;

      let replyHtml = replyTemplate
        .replace(/\[##_rp_rep_id_##\]/g, String(reply.id))
        .replace(/\[##_rp_rep_name_##\]/g, reply.user.nickname)
        .replace(/\[##_rp_rep_content_##\]/g, reply.content + '\n')
        .replace(/\[##_rp_rep_date_##\]/g, formatDateTime(reply.created_at))
        .replace(/\[##_rp_rep_time_##\]/g, formatSimpleDate(reply.created_at))
        .replace(/\[##_rp_rep_link_##\]/g, `#reply-${reply.id}`)
        .replace(/\[##_rp_rep_depth_##\]/g, String(depth) + '\n')
        .replace(/\[##_rp_rep_depth_class_##\]/g, depthClass)
        .replace(/\[##_rp_rep_indent_style_##\]/g, indentStyle)
        .replace(/\[##_rp_rep_reply_button_##\]/g, replyButtonHtml)
        .replace(/\[##_rp_rep_profile_image_##\]/g, profileImageHtml);

      // 기존 템플릿에도 ID와 data 속성 추가
      if (replyHtml.includes('class="comment-item"') || replyHtml.includes("class='comment-item'")) {
        replyHtml = replyHtml.replace(/(class="comment-item[^"]*")/g, `id="reply-${reply.id}" data-reply-id="${reply.id}" $1`);
        replyHtml = replyHtml.replace(/(class='comment-item[^']*')/g, `id="reply-${reply.id}" data-reply-id="${reply.id}" $1`);
      }

      // 댓글 아이템에 depth 클래스 추가
      if (depth > 0) {
        // comment-item 클래스에 reply 클래스와 depth 클래스 추가
        replyHtml = replyHtml.replace(/(<div[^>]*class="[^"]*comment-item[^"]*")/g, `$1 reply ${depthClass}"`);
      }

      // 템플릿이 기본 구조가 아닌 경우 프로필 이미지를 직접 삽입
      if (!replyHtml.includes('[##_rp_rep_profile_image_##]')) {
        // 간단한 방법: 댓글 전체를 새로운 구조로 래핑
        const simpleReplyHtml = `
           <div id="reply-${reply.id}" class="comment-item ${depth > 0 ? 'reply ' + depthClass : ''}" style="${indentStyle}" data-reply-id="${reply.id}">
             <div style="display: flex; gap: 12px; align-items: flex-start;">
               <div style="flex-shrink: 0;">
                 ${profileImageHtml}
               </div>
               <div style="flex: 1;">
                 <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
                   <span style="font-weight: bold; color: #374151;">${reply.user.nickname}</span>
                   <span>${formatSimpleDate(reply.created_at)}</span>
                 </div>
                 <div style="line-height: 1.6; word-wrap: break-word; margin-bottom: 8px;">${reply.content}
</div>
                 <div style="display: flex; align-items: center;">
                   ${replyButtonHtml}
                 </div>
               </div>
             </div>
           </div>
         `;
        replyHtml = simpleReplyHtml;
      }

      repliesHtml += replyHtml;
    }
  });
  result = result.replace(repliesPattern, repliesHtml);

  // 댓글 개수 치환
  result = result.replace(/\[##_article_rep_rp_cnt_##\]/g, String(data.replies.length));
  result = result.replace(/\[##_rp_count_##\]/g, String(data.replies.length));

  // 전체 글 개수 치환
  result = result.replace(/\[##_count_total_##\]/g, String(data.totalContentsCount ?? data.contents.length));

  // 댓글 관련 기본 치환자 - PAGE나 NOTICE 타입에서는 댓글 입력 폼 제거
  const commentFormHtml =
    data.currentArticle?.type === 'PAGE' || data.currentArticle?.type === 'NOTICE'
      ? ''
      : `
    <div class="comment-form">
      <div id="login-required-message" style="display: none; padding: 15px; background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; margin-bottom: 15px; text-align: center;">
        <p style="margin: 0; color: #6c757d;">댓글을 작성하려면 로그인이 필요합니다.</p>
        <a href="/auth" style="color: #007bff; text-decoration: none; font-weight: bold;">로그인하기</a>
      </div>
      
      <form id="comment-form" onsubmit="return submitComment(event)" style="display: none;">
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px;">
          <!-- 사용자 프로필 영역 -->
          <div id="user-profile-section" style="display: flex; flex-direction: column; align-items: center; min-width: 60px;">
            <div id="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
              <!-- 프로필 이미지 또는 이니셜이 여기에 들어감 -->
            </div>
            <div id="user-nickname" style="font-size: 12px; color: #6b7280; text-align: center; font-weight: 500;">
              <!-- 닉네임이 여기에 들어감 -->
            </div>
          </div>
          
          <!-- 댓글 입력 영역 -->
          <div style="flex: 1;">
            <textarea 
              id="comment-content" 
              name="content" 
              rows="4" 
              required 
              placeholder="댓글을 입력하세요..."
              style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; resize: vertical; font-family: inherit; font-size: 14px; line-height: 1.5; color: #333333 !important; background-color: #ffffff !important;"
            ></textarea>
            <div style="text-align: right; margin-top: 8px;">
              <button 
                type="submit" 
                id="submit-comment-btn"
                style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;"
              >
                댓글 작성
              </button>
            </div>
          </div>
        </div>
      </form>

      <style>
        .comment-form {
          margin-top: 20px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        
        .comment-form textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .comment-form button:hover {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .reply-depth-1 {
          background-color: #f8f9fa;
        }
        
        .reply-depth-2 {
          background-color: #f1f3f4;
        }
        
        .reply-depth-3 {
          background-color: #e8eaed;
        }
        
        .comment-item {
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        
        .comment-item.reply {
          margin-top: 10px;
        }
        
        .comment-profile {
          flex-shrink: 0;
        }
        
        .comment-body {
          flex: 1;
        }
        
        .comment-meta {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .comment-author {
          font-weight: bold;
          color: #374151;
          margin-right: 10px;
        }
        
        .comment-date {
          margin-right: 10px;
        }
        
        .comment-content {
          line-height: 1.6;
          word-wrap: break-word;
          margin-bottom: 8px;
        }
        
        .comment-actions {
          display: flex;
          align-items: center;
        }
        
        /* 답글 폼 스타일 */
        .reply-form-container {
          animation: slideDown 0.2s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .reply-form-container textarea:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .reply-form-container button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        /* 모바일 반응형 스타일 */
        @media (max-width: 640px) {
          .comment-form > div {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          #user-profile-section {
            flex-direction: row !important;
            align-items: center !important;
            gap: 8px !important;
            min-width: auto !important;
          }
          
          #user-avatar {
            width: 32px !important;
            height: 32px !important;
            margin-bottom: 0 !important;
          }
          
          #user-nickname {
            font-size: 14px !important;
            text-align: left !important;
          }
        }
      </style>

      <script>
        // 사용자 프로필 정보 업데이트 함수
        function updateUserProfile(user) {
          const userAvatar = document.getElementById('user-avatar');
          const userNickname = document.getElementById('user-nickname');
          
          if (userAvatar && userNickname) {
            // 닉네임 업데이트
            userNickname.textContent = user.nickname || '사용자';
            
            // 프로필 이미지 업데이트
            if (user.profile_image) {
              // 프로필 이미지가 있는 경우
              userAvatar.innerHTML = '<img src="' + user.profile_image + '" alt="프로필" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">';
            } else {
              // 프로필 이미지가 없는 경우 이니셜 표시
              const initial = user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U';
              userAvatar.innerHTML = '<span style="color: white; font-weight: bold; font-size: 16px;">' + initial + '</span>';
              userAvatar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            }
            

          }
        }

        // 로그인 상태 확인 및 댓글 폼 표시/숨김
        function checkLoginStatus() {
          // localStorage에서 userStore 데이터 확인
          const storageKey = 'user-storage';
          let user = null;
          let isAuthenticated = false;
          
          const storageData = window.localStorage.getItem(storageKey);
          
          if (storageData) {
            try {
              const storage = JSON.parse(storageData);
              
              // Zustand persist 구조 확인
              if (storage.state && storage.state.userInfo && storage.state.userInfo.id) {
                user = storage.state.userInfo;
                isAuthenticated = storage.state.isAuthenticated || false;
              }
            } catch (error) {
            }
          }
          
          if (user && user.id && isAuthenticated) {
            // 로그인된 상태 - 댓글 폼 표시 및 사용자 프로필 업데이트
            const commentForm = document.getElementById('comment-form');
            const loginMessage = document.getElementById('login-required-message');
            
            if (commentForm) {
              commentForm.style.display = 'block';
            }
            if (loginMessage) {
              loginMessage.style.display = 'none';
            }
            
            // 사용자 프로필 정보 업데이트
            updateUserProfile(user);
            
            return user;
          }
          
          // 로그인되지 않은 상태 - 로그인 안내 메시지 표시
          const commentForm = document.getElementById('comment-form');
          const loginMessage = document.getElementById('login-required-message');
          
          if (commentForm) {
            commentForm.style.display = 'none';
          }
          if (loginMessage) {
            loginMessage.style.display = 'block';
          }
          
          return null;
        }

        // 댓글 제출 함수
        async function submitComment(event) {
          event.preventDefault();
          
          const user = checkLoginStatus();
          if (!user) {
            alert('로그인이 필요합니다.');
            return false;
          }

          const content = document.getElementById('comment-content').value.trim();
          if (!content) {
            alert('댓글 내용을 입력해주세요.');
            return false;
          }

          const submitBtn = document.getElementById('submit-comment-btn');
          submitBtn.disabled = true;
          submitBtn.textContent = '작성 중...';

          try {
            const response = await fetch('/api/replies', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                contentId: ${data.currentArticle?.id || 0},
                contentText: content
              })
            });

                         if (response.ok) {
               // 댓글 작성 성공 - 입력 필드 초기화 후 페이지 새로고침
               document.getElementById('comment-content').value = '';
               alert('댓글이 작성되었습니다.');
               location.reload();
             } else {
               const errorData = await response.json();
               alert('댓글 작성에 실패했습니다: ' + (errorData.message || '알 수 없는 오류'));
             }
          } catch (error) {
            alert('댓글 작성 중 오류가 발생했습니다.');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '댓글 작성';
          }

          return false;
        }

        // 답글 입력창 생성 함수
        function createReplyForm(parentReplyId, user) {
          return \`
            <div id="reply-form-\${parentReplyId}" class="reply-form-container" style="margin-top: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #007bff;">
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <!-- 사용자 프로필 -->
                <div style="flex-shrink: 0;">
                  \${user.profile_image 
                    ? \`<img src="\${user.profile_image}" alt="프로필" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">\`
                    : \`<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-weight: bold; font-size: 14px;">\${user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}</span>
                       </div>\`
                  }
                </div>
                
                <!-- 답글 입력 영역 -->
                <div style="flex: 1;">
                  <div style="margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #6b7280;">답글 작성 중...</span>
                  </div>
                  <textarea 
                    id="reply-content-\${parentReplyId}" 
                    placeholder="답글을 입력하세요..." 
                    rows="3"
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; resize: vertical; font-family: inherit; font-size: 14px; color: #333333 !important; background-color: #ffffff !important;"
                  ></textarea>
                  <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
                    <button 
                      onclick="cancelReply(\${parentReplyId})"
                      style="background: #6c757d; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    >
                      취소
                    </button>
                    <button 
                      onclick="submitReply(\${parentReplyId})"
                      style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    >
                      답글 작성
                    </button>
                  </div>
                </div>
              </div>
            </div>
          \`;
        }

        // 대댓글 작성 함수 (새로운 방식)
        async function replyToComment(parentReplyId) {
          const user = checkLoginStatus();
          if (!user) {
            alert('로그인이 필요합니다.');
            window.location.href = '/auth';
            return;
          }

          // 이미 열린 답글 폼이 있으면 닫기
          const existingForm = document.querySelector('.reply-form-container');
          if (existingForm) {
            existingForm.remove();
          }

          // 부모 댓글 요소 찾기
          const parentElement = document.querySelector(\`[data-reply-id="\${parentReplyId}"], #reply-\${parentReplyId}\`);
          if (!parentElement) {
            // 대체 방법: 답글 버튼의 부모 요소에서 댓글 컨테이너 찾기
            const replyButton = event.target;
            const commentItem = replyButton.closest('.comment-item') || replyButton.closest('div[style*="flex"]');
            if (commentItem) {
              const replyFormHtml = createReplyForm(parentReplyId, user);
              commentItem.insertAdjacentHTML('afterend', replyFormHtml);
              
              // 답글 입력창에 포커스
              const textarea = document.getElementById(\`reply-content-\${parentReplyId}\`);
              if (textarea) {
                textarea.focus();
              }
            } else {
              alert('댓글을 찾을 수 없습니다. 페이지를 새로고침 후 다시 시도해주세요.');
            }
            return;
          }

          // 답글 폼 HTML 생성 및 삽입
          const replyFormHtml = createReplyForm(parentReplyId, user);
          parentElement.insertAdjacentHTML('afterend', replyFormHtml);

          // 답글 입력창에 포커스
          const textarea = document.getElementById(\`reply-content-\${parentReplyId}\`);
          if (textarea) {
            textarea.focus();
          }
        }

        // 답글 취소 함수
        function cancelReply(parentReplyId) {
          const replyForm = document.getElementById(\`reply-form-\${parentReplyId}\`);
          if (replyForm) {
            replyForm.remove();
          }
        }

        // 답글 제출 함수
        async function submitReply(parentReplyId) {
          const user = checkLoginStatus();
          if (!user) {
            alert('로그인이 필요합니다.');
            return;
          }

          const textarea = document.getElementById(\`reply-content-\${parentReplyId}\`);
          const content = textarea ? textarea.value.trim() : '';
          
          if (!content) {
            alert('답글 내용을 입력해주세요.');
            return;
          }

          const submitBtn = event.target;
          submitBtn.disabled = true;
          submitBtn.textContent = '작성 중...';

          try {
            const response = await fetch('/api/replies', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                contentId: ${data.currentArticle?.id || 0},
                parentReplyId: parentReplyId,
                contentText: content
              })
            });

            if (response.ok) {
              alert('답글이 작성되었습니다.');
              location.reload();
            } else {
              const errorData = await response.json();
              alert('답글 작성에 실패했습니다: ' + (errorData.message || '알 수 없는 오류'));
            }
          } catch (error) {
            alert('답글 작성 중 오류가 발생했습니다.');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '답글 작성';
          }
        }

        // 전역 함수로 등록 (템플릿에서 사용할 수 있도록)
        window.replyToComment = replyToComment;
        window.cancelReply = cancelReply;
        window.submitReply = submitReply;

        // 페이지 로드 시 로그인 상태 확인
        document.addEventListener('DOMContentLoaded', function() {
          // 즉시 확인
          checkLoginStatus();
          
          // 약간의 지연 후 재확인 (localStorage 완전 로드 대기)
          setTimeout(function() {
            checkLoginStatus();
          }, 100);
          
          // 주기적으로 로그인 상태 재확인 (다른 탭에서 로그인/로그아웃한 경우)
          setInterval(function() {
            checkLoginStatus();
          }, 3000);
        });
      </script>
    </div>
  `;

  result = result.replace(/\[##_rp_input_form_##\]/g, commentFormHtml);

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

    // 6. 글 카테고리 (타입에 따라 다르게 표시)
    if (article.category) {
      result = result.replace(/\[##_article_category_##\]/g, article.category.name);
    } else {
      // 타입에 따라 기본 카테고리명 설정
      let defaultCategory = '미분류';
      if (article.type === 'PAGE') {
        defaultCategory = '페이지';
      } else if (article.type === 'NOTICE') {
        defaultCategory = '공지';
      }
      result = result.replace(/\[##_article_category_##\]/g, defaultCategory);
    }

    // 7. 글 태그 (미구현이므로 빈 문자열)
    result = result.replace(/\[##_article_tags_##\]/g, '');

    // 8. 조회수 처리 (total_views 필드 추가 필요)
    result = result.replace(/\[##_article_total_views_##\]/g, String(article.total_views || 0));

    // 9. 이전 글
    if (article.prev_article) {
      result = result.replace(/\[##_article_prev_##\]/g, `<a href="/posts/${article.prev_article.sequence}" title="${article.prev_article.title}">이전 글</a>`);
    } else {
      result = result.replace(/\[##_article_prev_##\]/g, '');
    }

    // 10. 다음 글
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
      .replace(/\[##_article_total_views_##\]/g, '')
      .replace(/\[##_article_prev_##\]/g, '')
      .replace(/\[##_article_next_##\]/g, '');
  }

  // 페이지네이션 처리
  if (data.pagination) {
    const pagination = data.pagination;

    // 페이지네이션 블록 표시/숨김
    if (pagination.totalPages > 1) {
      result = result.replace(/<s_pagination>([\s\S]*?)<\/s_pagination>/g, '$1');

      // 페이지네이션 치환자들
      result = result.replace(/\[##_pagination_first_##\]/g, pagination.currentPage > 1 ? '?page=1' : '#');
      result = result.replace(/\[##_pagination_first_disabled_##\]/g, pagination.currentPage <= 1 ? 'disabled' : '');

      result = result.replace(/\[##_pagination_last_##\]/g, pagination.currentPage < pagination.totalPages ? `?page=${pagination.totalPages}` : '#');
      result = result.replace(/\[##_pagination_last_disabled_##\]/g, pagination.currentPage >= pagination.totalPages ? 'disabled' : '');

      // 10페이지 블록 계산
      const currentBlock = Math.floor((pagination.currentPage - 1) / 10);
      const prevBlockPage = currentBlock > 0 ? (currentBlock - 1) * 10 + 1 : 1;
      const nextBlockPage = (currentBlock + 1) * 10 + 1;

      result = result.replace(/\[##_pagination_prev_block_##\]/g, currentBlock > 0 ? `?page=${prevBlockPage}` : '#');
      result = result.replace(/\[##_pagination_prev_block_disabled_##\]/g, currentBlock <= 0 ? 'disabled' : '');

      result = result.replace(/\[##_pagination_next_block_##\]/g, nextBlockPage <= pagination.totalPages ? `?page=${nextBlockPage}` : '#');
      result = result.replace(/\[##_pagination_next_block_disabled_##\]/g, nextBlockPage > pagination.totalPages ? 'disabled' : '');

      // 페이지 번호 반복 처리
      const paginationRepPattern = /\[##_pagination_rep_##\]([\s\S]*?)\[\/##_pagination_rep_##\]/g;
      let paginationRepHtml = '';

      const startPage = currentBlock * 10 + 1;
      const endPage = Math.min(startPage + 9, pagination.totalPages);

      for (let i = startPage; i <= endPage; i++) {
        const pageTemplate = result.match(paginationRepPattern)?.[0]?.replace(/\[##_pagination_rep_##\]|\[\/##_pagination_rep_##\]/g, '') || '';
        if (pageTemplate) {
          let pageHtml = pageTemplate
            .replace(/\[##_pagination_rep_link_##\]/g, `?page=${i}`)
            .replace(/\[##_pagination_rep_number_##\]/g, String(i))
            .replace(/\[##_pagination_rep_class_##\]/g, i === pagination.currentPage ? 'current' : '');

          paginationRepHtml += pageHtml;
        }
      }

      result = result.replace(paginationRepPattern, paginationRepHtml);
    } else {
      // 페이지가 1개뿐이면 페이지네이션 숨김
      result = result.replace(/<s_pagination>[\s\S]*?<\/s_pagination>/g, '');
    }
  } else {
    // 페이지네이션 정보가 없으면 숨김
    result = result.replace(/<s_pagination>[\s\S]*?<\/s_pagination>/g, '');
  }

  // s_rp_count 블록 처리 (댓글 개수가 0이 아닐 때만 표시)
  if (data.currentArticle && data.currentArticle.reply_count > 0) {
    result = result.replace(/<s_rp_count>([\s\S]*?)<\/s_rp_count>/g, '$1');
  } else {
    result = result.replace(/<s_rp_count>[\s\S]*?<\/s_rp_count>/g, '');
  }

  // s_article_comments 블록 처리 - POSTS 타입에서만 댓글 표시
  if (data.currentArticle) {
    const article = data.currentArticle;
    if (article.type === 'POSTS' || !article.type) {
      // POSTS 타입이거나 타입이 없는 경우 (기본값) 댓글 섹션 표시
      result = result.replace(/<s_article_comments>([\s\S]*?)<\/s_article_comments>/g, '$1');
      // 댓글 입력 폼도 표시
      result = result.replace(/<s_comment_form>([\s\S]*?)<\/s_comment_form>/g, '$1');
    } else {
      // PAGE나 NOTICE 타입인 경우 댓글 섹션 완전 제거
      result = result.replace(/<s_article_comments>[\s\S]*?<\/s_article_comments>/g, '');
      // 댓글 입력 폼도 제거
      result = result.replace(/<s_comment_form>[\s\S]*?<\/s_comment_form>/g, '');
    }
  } else {
    // 개별 글 페이지가 아닌 경우 댓글 섹션 제거
    result = result.replace(/<s_article_comments>[\s\S]*?<\/s_article_comments>/g, '');
    result = result.replace(/<s_comment_form>[\s\S]*?<\/s_comment_form>/g, '');
  }

  // s_index_article_rep 블록 처리 (글 목록 페이지에서 표시)
  if ((data.isAllPostsPage || data.isCategoryPage) && data.currentArticle === undefined) {
    result = result.replace(/<s_index_article_rep>([\s\S]*?)<\/s_index_article_rep>/g, '$1');
  } else {
    result = result.replace(/<s_index_article_rep>[\s\S]*?<\/s_index_article_rep>/g, '');
  }

  // 사이드바 블록 처리
  result = result.replace(/<s_sidebar>([\s\S]*?)<\/s_sidebar>/g, '$1');
  result = result.replace(/<s_sidebar_element>([\s\S]*?)<\/s_sidebar_element>/g, '$1');

  // 티스토리 공통 JS 삽입 블록 치환
  result = result.replace(/<s_t3>[\s\S]*?<\/s_t3>/g, T3_SCRIPT);

  // PostSmith 테마 JavaScript 주입 치환자
  result = result.replace(/\[##_theme_script_##\]/g, POSTSMITH_THEME_SCRIPT);

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
      // body 태그의 속성을 div로 이전하여 CSS 선택자 유지
      .replace(/<body([^>]*)>/g, '<div$1>')
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
