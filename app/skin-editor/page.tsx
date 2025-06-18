'use client';

import Editor from '@monaco-editor/react';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';

import { renderTemplate } from '../../lib/template/TemplateEngine';

interface ThemeContent {
  blogId: number;
  blogName: string;
  themeHtml: string;
  themeCss: string;
  themeName: string;
  themeId?: number;
}

interface HomeData {
  blog: {
    id: number;
    nickname: string;
    description: string | null;
    logo_image: string | null;
    address: string;
  };
  categories: Array<{
    id: number;
    name: string;
    post_count: number;
    category_id: number | null;
  }>;
  uncategorizedCount: number;
  totalContentsCount: number;
  menus: Array<{
    id: number;
    name: string;
    type: string;
    uri: string;
    is_blank: boolean;
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
  recentContents: any[];
  popularContents: any[];
  recentReplies: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalContents: number;
    hasNext: boolean;
    hasPrev: boolean;
    pageSize: number;
  };
}

function SkinEditorContent() {
  const searchParams = useSearchParams();
  const blogId = searchParams?.get('blogId') || ''; // 빈 문자열로 설정하여 API가 호스트에서 추출하도록 함
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');
  const [themeContent, setThemeContent] = useState<ThemeContent | null>(null);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 편집 가능한 HTML/CSS 상태
  const [editableHtml, setEditableHtml] = useState<string>('');
  const [editableCss, setEditableCss] = useState<string>('');
  const [isModified, setIsModified] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [saving, setSaving] = useState(false);

  // 템플릿 엔진을 사용하여 홈 데이터 처리
  const processTemplate = (html: string, blogData: ThemeContent, realData: HomeData) => {
    // 홈 페이지와 동일한 데이터 구조로 변환
    const templateData = {
      blog: {
        nickname: realData.blog.nickname,
        description: realData.blog.description,
        logo_image: realData.blog.logo_image,
        address: realData.blog.address,
      },
      categories: realData.categories,
      uncategorizedCount: realData.uncategorizedCount,
      totalContentsCount: realData.totalContentsCount,
      menus: realData.menus,
      contents: realData.contents,
      recentContents: realData.recentContents,
      popularContents: realData.popularContents,
      recentReplies: realData.recentReplies,
      replies: [],
      isAllPostsPage: true,
      pagination: realData.pagination,
    };

    // 템플릿 엔진을 사용하여 처리
    let processedHtml = renderTemplate(html, '', templateData);

    // 링크 클릭 방지를 위한 후처리
    processedHtml = processedHtml.replace(/<a\s+href="[^"]*"/g, '<a href="#" onclick="return false;"');

    return processedHtml;
  };

  // 테마 컨텐츠 및 홈 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 테마 정보와 홈 데이터를 병렬로 가져오기
        const themeUrl = blogId ? `/api/blog/theme-content?blogId=${blogId}` : '/api/blog/theme-content';
        const homeUrl = blogId ? `/api/blog/home-data?blogId=${blogId}` : '/api/blog/home-data';

        const [themeResponse, homeResponse] = await Promise.all([fetch(themeUrl), fetch(homeUrl)]);

        const themeResult = await themeResponse.json();
        const homeResult = await homeResponse.json();

        if (themeResult.success && homeResult.success) {
          setThemeContent(themeResult.data);
          setHomeData(homeResult.data);
          // 편집 가능한 상태 초기화
          setEditableHtml(themeResult.data.themeHtml);
          setEditableCss(themeResult.data.themeCss);
          setIsModified(false);
        } else {
          setError(themeResult.error || homeResult.error || '데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [blogId]);

  // HTML/CSS 변경 핸들러 (Monaco Editor용)
  const handleHtmlChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditableHtml(value);
      setIsModified(true);
    }
  };

  const handleCssChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditableCss(value);
      setIsModified(true);
    }
  };

  // 미리보기 적용 함수
  const applyChanges = () => {
    if (themeContent) {
      setThemeContent({
        ...themeContent,
        themeHtml: editableHtml,
        themeCss: editableCss,
      });
      setIsModified(false);
    }
  };

  // 저장 함수 추가
  const handleSave = async () => {
    if (!themeContent?.blogId) {
      alert('블로그 ID를 찾을 수 없습니다.');
      return;
    }

    try {
      setSaving(true);

      // 먼저 변경사항을 적용
      if (isModified) {
        applyChanges();
      }

      // Spring API에 저장 요청 (BlogDto 형태로)
      const response = await fetch('/api/blog/update-theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogId: themeContent.blogId,
          themeHtml: editableHtml,
          themeCss: editableCss,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('스킨이 성공적으로 저장되었습니다!');
        setIsModified(false);
      } else {
        alert(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 가이드 데이터
  const guideData = {
    variables: [
      {
        category: '기본 블로그 정보',
        items: [
          { name: '[##_page_title_##]', description: '페이지 제목 (블로그명)', example: '내 개발 블로그' },
          { name: '[##_title_##]', description: '블로그 제목', example: '내 개발 블로그' },
          { name: '[##_desc_##]', description: '블로그 설명', example: '개발자의 기술 블로그입니다.' },
          { name: '[##_image_##]', description: '블로그 대표 이미지 URL', example: '/logo.png' },
          { name: '[##_blog_link_##]', description: '블로그 홈 링크', example: '/' },
          { name: '[##_body_id_##]', description: 'body 태그 ID', example: 'tt-body-index' },
          { name: '[##_blog_image_##]', description: '블로그 로고 이미지 HTML', example: "<img src='/logo.png' alt='블로그' />" },
          { name: '[##_blog_menu_##]', description: '블로그 메뉴 HTML', example: "<ul><li><a href='/'>홈</a></li></ul>" },
        ],
      },
      {
        category: '카테고리',
        items: [{ name: '[##_category_##]', description: '카테고리 목록 HTML (계층구조)', example: "<ul><li><a href='/category/개발'>개발 (15)</a></li></ul>" }],
      },
      {
        category: '글 목록 반복',
        items: [
          { name: '<s_article_rep>', description: '글 목록 반복 시작 태그', example: '' },
          { name: '</s_article_rep>', description: '글 목록 반복 끝 태그', example: '' },
          { name: '[##_article_rep_link_##]', description: '개별 글 링크', example: '/posts/123' },
          { name: '[##_article_rep_title_##]', description: '글 제목', example: 'React Hook 사용법' },
          { name: '[##_article_rep_date_##]', description: '글 작성일 (전체)', example: '2024.01.15 14:30' },
          { name: '[##_article_rep_simple_date_##]', description: '간단한 날짜', example: '1월 15일' },
          { name: '[##_article_rep_date_year_##]', description: '연도', example: '2024' },
          { name: '[##_article_rep_date_month_##]', description: '월', example: '01' },
          { name: '[##_article_rep_date_day_##]', description: '일', example: '15' },
          { name: '[##_article_rep_time_##]', description: '시간', example: '14:30' },
          { name: '[##_article_rep_desc_##]', description: '글 요약 (150자)', example: 'React Hook은 함수형 컴포넌트에서...' },
          { name: '[##_article_rep_rp_cnt_##]', description: '댓글 수', example: '5' },
          { name: '[##_article_rep_category_##]', description: '글 카테고리명', example: '개발' },
          { name: '[##_article_rep_category_link_##]', description: '카테고리 링크', example: '/category/개발' },
          { name: '[##_article_rep_thumbnail_url_##]', description: '썸네일 이미지 URL', example: '/thumb.jpg' },
        ],
      },
      {
        category: '썸네일 조건부 블록',
        items: [
          { name: '<s_article_rep_thumbnail>', description: '썸네일이 있을 때만 표시 시작', example: '' },
          { name: '</s_article_rep_thumbnail>', description: '썸네일이 있을 때만 표시 끝', example: '' },
        ],
      },
      {
        category: '댓글 수 조건부 블록',
        items: [
          { name: '<s_rp_count>', description: '댓글이 있을 때만 표시 시작', example: '' },
          { name: '</s_rp_count>', description: '댓글이 있을 때만 표시 끝', example: '' },
        ],
      },
      {
        category: '최근 글 반복',
        items: [
          { name: '<s_rctps_rep>', description: '최근 글 반복 시작', example: '' },
          { name: '</s_rctps_rep>', description: '최근 글 반복 끝', example: '' },
          { name: '[##_rctps_rep_link_##]', description: '최근 글 링크', example: '/posts/123' },
          { name: '[##_rctps_rep_title_##]', description: '최근 글 제목', example: '최신 글 제목' },
          { name: '[##_rctps_rep_rp_cnt_##]', description: '최근 글 댓글 수', example: '3' },
          { name: '[##_rctps_rep_thumbnail_##]', description: '최근 글 썸네일 URL', example: '/thumb.jpg' },
        ],
      },
      {
        category: '최근 글 썸네일 조건부',
        items: [
          { name: '<s_rctps_rep_thumbnail>', description: '최근 글 썸네일이 있을 때만 표시 시작', example: '' },
          { name: '</s_rctps_rep_thumbnail>', description: '최근 글 썸네일이 있을 때만 표시 끝', example: '' },
        ],
      },
      {
        category: '인기 글 반복',
        items: [
          { name: '<s_rctps_popular_rep>', description: '인기 글 반복 시작', example: '' },
          { name: '</s_rctps_popular_rep>', description: '인기 글 반복 끝', example: '' },
          { name: '[##_rctps_rep_author_##]', description: '인기 글 작성자', example: '관리자' },
          { name: '[##_rctps_rep_category_##]', description: '인기 글 카테고리', example: '개발' },
          { name: '[##_rctps_rep_category_link_##]', description: '인기 글 카테고리 링크', example: '/category/개발' },
        ],
      },
      {
        category: '최근 댓글 반복',
        items: [
          { name: '<s_rctrp_rep>', description: '최근 댓글 반복 시작', example: '' },
          { name: '</s_rctrp_rep>', description: '최근 댓글 반복 끝', example: '' },
          { name: '[##_rctrp_rep_link_##]', description: '댓글이 달린 글 링크', example: '/posts/123' },
          { name: '[##_rctrp_rep_desc_##]', description: '댓글 내용 (50자)', example: '좋은 글이네요...' },
          { name: '[##_rctrp_rep_name_##]', description: '댓글 작성자', example: '홍길동' },
          { name: '[##_rctrp_rep_time_##]', description: '댓글 작성시간', example: '1월 15일' },
        ],
      },
      {
        category: '개별 글 페이지',
        items: [
          { name: '[##_article_permalink_##]', description: '개별 글 고유 링크', example: '/posts/123' },
          { name: '[##_article_title_##]', description: '개별 글 제목', example: 'React Hook 완벽 가이드' },
          { name: '[##_article_content_##]', description: '개별 글 HTML 내용', example: '<p>글 내용...</p>' },
          { name: '[##_article_date_##]', description: '개별 글 작성일시', example: '2024.01.15 14:30' },
          { name: '[##_article_date_year_##]', description: '개별 글 연도', example: '2024' },
          { name: '[##_article_date_month_##]', description: '개별 글 월', example: '01' },
          { name: '[##_article_date_day_##]', description: '개별 글 일', example: '15' },
          { name: '[##_article_time_##]', description: '개별 글 시간', example: '14:30' },
          { name: '[##_article_author_##]', description: '개별 글 작성자', example: '관리자' },
          { name: '[##_article_category_##]', description: '개별 글 카테고리', example: '개발' },
          { name: '[##_article_tags_##]', description: '개별 글 태그', example: '' },
          { name: '[##_article_total_views_##]', description: '개별 글 총 조회수', example: '125' },
          { name: '[##_article_prev_##]', description: '이전 글 링크', example: "<a href='/posts/122'>이전 글</a>" },
          { name: '[##_article_next_##]', description: '다음 글 링크', example: "<a href='/posts/124'>다음 글</a>" },
        ],
      },
      {
        category: '댓글 관련',
        items: [
          { name: '[##_rp_input_form_##]', description: '댓글 입력 폼 HTML', example: '<form>...</form>' },
          { name: '[##_rp_count_##]', description: '총 댓글 수', example: '5' },
          { name: '[##_rp_rep_##]', description: '댓글 목록 반복 시작', example: '' },
          { name: '[/##_rp_rep_##]', description: '댓글 목록 반복 끝', example: '' },
          { name: '[##_rp_rep_id_##]', description: '댓글 ID', example: '123' },
          { name: '[##_rp_rep_name_##]', description: '댓글 작성자', example: '홍길동' },
          { name: '[##_rp_rep_content_##]', description: '댓글 내용', example: '좋은 글이네요!' },
          { name: '[##_rp_rep_date_##]', description: '댓글 작성일시', example: '2024.01.15 14:30' },
          { name: '[##_rp_rep_time_##]', description: '댓글 간단 시간', example: '1월 15일' },
          { name: '[##_rp_rep_link_##]', description: '댓글 앵커 링크', example: '#reply-123' },
          { name: '[##_rp_rep_depth_##]', description: '댓글 깊이 (답글 레벨)', example: '1' },
          { name: '[##_rp_rep_depth_class_##]', description: '댓글 깊이 CSS 클래스', example: 'reply-depth-1' },
          { name: '[##_rp_rep_indent_style_##]', description: '댓글 들여쓰기 스타일', example: 'margin-left: 20px;' },
          { name: '[##_rp_rep_reply_button_##]', description: '답글 버튼 HTML', example: '<button>답글</button>' },
          { name: '[##_rp_rep_profile_image_##]', description: '댓글 작성자 프로필 이미지', example: "<img src='/profile.jpg' />" },
        ],
      },
      {
        category: '페이지네이션',
        items: [
          { name: '[##_pagination_first_##]', description: '첫 페이지 링크', example: '?page=1' },
          { name: '[##_pagination_first_disabled_##]', description: '첫 페이지 비활성 클래스', example: 'disabled' },
          { name: '[##_pagination_last_##]', description: '마지막 페이지 링크', example: '?page=10' },
          { name: '[##_pagination_last_disabled_##]', description: '마지막 페이지 비활성 클래스', example: 'disabled' },
          { name: '[##_pagination_prev_block_##]', description: '이전 블록 링크', example: '?page=1' },
          { name: '[##_pagination_prev_block_disabled_##]', description: '이전 블록 비활성 클래스', example: 'disabled' },
          { name: '[##_pagination_next_block_##]', description: '다음 블록 링크', example: '?page=11' },
          { name: '[##_pagination_next_block_disabled_##]', description: '다음 블록 비활성 클래스', example: 'disabled' },
          { name: '[##_pagination_rep_##]', description: '페이지 번호 반복 시작', example: '' },
          { name: '[/##_pagination_rep_##]', description: '페이지 번호 반복 끝', example: '' },
          { name: '[##_pagination_rep_link_##]', description: '페이지 번호 링크', example: '?page=2' },
          { name: '[##_pagination_rep_number_##]', description: '페이지 번호', example: '2' },
          { name: '[##_pagination_rep_class_##]', description: '현재 페이지 CSS 클래스', example: 'current' },
        ],
      },
      {
        category: '통계 및 카운트',
        items: [{ name: '[##_count_total_##]', description: '전체 글 수', example: '150' }],
      },
    ],
    conditionalBlocks: [
      {
        category: '조건부 표시 블록',
        items: [
          { name: '<s_article_protected>', description: '개별 글 페이지에서만 표시 시작', example: '' },
          { name: '</s_article_protected>', description: '개별 글 페이지에서만 표시 끝', example: '' },
          { name: '<s_index_article_rep>', description: '글 목록 페이지에서만 표시 시작', example: '' },
          { name: '</s_index_article_rep>', description: '글 목록 페이지에서만 표시 끝', example: '' },
          { name: '<s_article_comments>', description: '댓글 섹션 (POSTS 타입만)', example: '' },
          { name: '</s_article_comments>', description: '댓글 섹션 끝', example: '' },
          { name: '<s_comment_form>', description: '댓글 입력 폼 (POSTS 타입만)', example: '' },
          { name: '</s_comment_form>', description: '댓글 입력 폼 끝', example: '' },
          { name: '<s_pagination>', description: '페이지네이션 (다중 페이지일 때만)', example: '' },
          { name: '</s_pagination>', description: '페이지네이션 끝', example: '' },
          { name: '<s_sidebar>', description: '사이드바 영역', example: '' },
          { name: '</s_sidebar>', description: '사이드바 영역 끝', example: '' },
          { name: '<s_sidebar_element>', description: '사이드바 요소', example: '' },
          { name: '</s_sidebar_element>', description: '사이드바 요소 끝', example: '' },
          { name: '<s_t3>', description: '티스토리 공통 스크립트 삽입', example: '' },
          { name: '</s_t3>', description: '티스토리 공통 스크립트 끝', example: '' },
        ],
      },
    ],
    examples: [
      {
        title: '기본 블로그 헤더',
        html: `<header class="blog-header">
  <h1>[##_title_##]</h1>
  <p>[##_desc_##]</p>
  [##_blog_image_##]
  [##_blog_menu_##]
</header>`,
        description: '블로그 제목, 설명, 로고, 메뉴를 표시하는 헤더',
      },
      {
        title: '글 목록 (메인 페이지)',
        html: `<section class="posts">
  <s_article_rep>
  <article class="post">
    <h2><a href="[##_article_rep_link_##]">[##_article_rep_title_##]</a></h2>
    <div class="post-meta">
      <span>[##_article_rep_date_##]</span>
      <span>카테고리: [##_article_rep_category_##]</span>
      <s_rp_count>
      <span>댓글 [##_article_rep_rp_cnt_##]개</span>
      </s_rp_count>
    </div>
    <s_article_rep_thumbnail>
    <img src="[##_article_rep_thumbnail_url_##]" alt="썸네일" />
    </s_article_rep_thumbnail>
    <div class="post-content">
      [##_article_rep_desc_##]
    </div>
  </article>
  </s_article_rep>
</section>`,
        description: '글 목록을 썸네일, 제목, 요약과 함께 표시',
      },
      {
        title: '개별 글 페이지',
        html: `<s_article_protected>
<article class="single-post">
  <header>
    <h1>[##_article_title_##]</h1>
    <div class="post-meta">
      <span>작성자: [##_article_author_##]</span>
      <span>작성일: [##_article_date_##]</span>
      <span>조회수: [##_article_total_views_##]</span>
      <span>카테고리: [##_article_category_##]</span>
    </div>
  </header>
  
  <div class="post-content">
    [##_article_content_##]
  </div>
  
  <nav class="post-navigation">
    [##_article_prev_##]
    [##_article_next_##]
  </nav>
</article>

<s_article_comments>
<section class="comments">
  <h3>댓글 ([##_rp_count_##])</h3>
  
  <div class="comment-list">
    [##_rp_rep_##]
    <div class="comment" id="reply-[##_rp_rep_id_##]" style="[##_rp_rep_indent_style_##]">
      [##_rp_rep_profile_image_##]
      <div class="comment-body">
        <div class="comment-meta">
          <strong>[##_rp_rep_name_##]</strong>
          <span>[##_rp_rep_time_##]</span>
        </div>
        <div class="comment-content">[##_rp_rep_content_##]</div>
        [##_rp_rep_reply_button_##]
      </div>
    </div>
    [/##_rp_rep_##]
  </div>
  
  <s_comment_form>
  [##_rp_input_form_##]
  </s_comment_form>
</section>
</s_article_comments>
</s_article_protected>`,
        description: '개별 글 페이지의 제목, 내용, 메타 정보, 댓글 시스템',
      },
      {
        title: '사이드바 (최근 글 + 인기 글)',
        html: `<s_sidebar>
<aside class="sidebar">
  <s_sidebar_element>
  <div class="widget recent-posts">
    <h3>최근 글</h3>
    <ul>
      <s_rctps_rep>
      <li>
        <a href="[##_rctps_rep_link_##]">[##_rctps_rep_title_##]</a>
        <s_rctps_rep_thumbnail>
        <img src="[##_rctps_rep_thumbnail_##]" alt="썸네일" />
        </s_rctps_rep_thumbnail>
        <s_rp_count>
        <span>([##_rctps_rep_rp_cnt_##])</span>
        </s_rp_count>
      </li>
      </s_rctps_rep>
    </ul>
  </div>
  </s_sidebar_element>
  
  <s_sidebar_element>
  <div class="widget popular-posts">
    <h3>인기 글</h3>
    <ul>
      <s_rctps_popular_rep>
      <li>
        <a href="[##_rctps_rep_link_##]">[##_rctps_rep_title_##]</a>
        <div class="meta">
          <span>[##_rctps_rep_category_##]</span>
          <span>[##_rctps_rep_simple_date_##]</span>
        </div>
      </li>
      </s_rctps_popular_rep>
    </ul>
  </div>
  </s_sidebar_element>
  
  <s_sidebar_element>
  <div class="widget categories">
    <h3>카테고리</h3>
    [##_category_##]
  </div>
  </s_sidebar_element>
  
  <s_sidebar_element>
  <div class="widget recent-comments">
    <h3>최근 댓글</h3>
    <ul>
      <s_rctrp_rep>
      <li>
        <a href="[##_rctrp_rep_link_##]">
          <strong>[##_rctrp_rep_name_##]</strong>: 
          [##_rctrp_rep_desc_##]
        </a>
        <span class="time">[##_rctrp_rep_time_##]</span>
      </li>
      </s_rctrp_rep>
    </ul>
  </div>
  </s_sidebar_element>
</aside>
</s_sidebar>`,
        description: '최근 글, 인기 글, 카테고리, 최근 댓글을 포함한 사이드바',
      },
      {
        title: '페이지네이션',
        html: `<s_pagination>
<nav class="pagination">
  <a href="[##_pagination_first_##]" class="[##_pagination_first_disabled_##]">처음</a>
  <a href="[##_pagination_prev_block_##]" class="[##_pagination_prev_block_disabled_##]">이전</a>
  
  [##_pagination_rep_##]
  <a href="[##_pagination_rep_link_##]" class="[##_pagination_rep_class_##]">
    [##_pagination_rep_number_##]
  </a>
  [/##_pagination_rep_##]
  
  <a href="[##_pagination_next_block_##]" class="[##_pagination_next_block_disabled_##]">다음</a>
  <a href="[##_pagination_last_##]" class="[##_pagination_last_disabled_##]">마지막</a>
</nav>
</s_pagination>`,
        description: '10페이지 단위 블록형 페이지네이션',
      },
      {
        title: '완전한 레이아웃 구조',
        html: `<!DOCTYPE html>
<html>
<head>
  <title>[##_page_title_##]</title>
  <meta name="description" content="[##_desc_##]">
</head>
<body id="[##_body_id_##]">
  <header class="site-header">
    <h1><a href="[##_blog_link_##]">[##_title_##]</a></h1>
    <p>[##_desc_##]</p>
    [##_blog_menu_##]
  </header>
  
  <main class="main-content">
    <!-- 글 목록 페이지 -->
    <s_index_article_rep>
    <section class="post-list">
      <s_article_rep>
      <article>
        <h2><a href="[##_article_rep_link_##]">[##_article_rep_title_##]</a></h2>
        <div class="meta">[##_article_rep_date_##] | [##_article_rep_category_##]</div>
        <p>[##_article_rep_desc_##]</p>
      </article>
      </s_article_rep>
    </section>
    
    <s_pagination>
    <!-- 페이지네이션 코드 -->
    </s_pagination>
    </s_index_article_rep>
    
    <!-- 개별 글 페이지 -->
    <s_article_protected>
    <article class="single-post">
      <h1>[##_article_title_##]</h1>
      <div>[##_article_content_##]</div>
      
      <s_article_comments>
      <section class="comments">
        [##_rp_rep_##]
        <!-- 댓글 구조 -->
        [/##_rp_rep_##]
        [##_rp_input_form_##]
      </section>
      </s_article_comments>
    </article>
    </s_article_protected>
  </main>
  
  <s_sidebar>
  <aside class="sidebar">
    <!-- 사이드바 위젯들 -->
  </aside>
  </s_sidebar>
  
  <footer>
    <p>총 [##_count_total_##]개의 글</p>
  </footer>
  
  <s_t3>
  <!-- 티스토리 공통 스크립트 자동 삽입 -->
  </s_t3>
</body>
</html>`,
        description: '글 목록과 개별 글 페이지를 모두 지원하는 완전한 템플릿 구조',
      },
    ],
  };

  // Monaco Editor 설정
  const editorRef = useRef<any>(null);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Ctrl+Enter 또는 Cmd+Enter로 적용
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (isModified) {
        applyChanges();
      }
    });

    // Ctrl+S 또는 Cmd+S로 저장
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">테마 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !themeContent || !homeData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button onClick={() => window.history.back()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* 헤더 */}
      <header className="flex-shrink-0 border-b bg-white shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">스킨 편집</h1>
                <p className="text-sm text-gray-600">
                  {themeContent.blogName} - {themeContent.themeName}
                </p>
              </div>
              <button
                onClick={() => setShowGuide(true)}
                className="rounded bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700"
                title="스킨 편집 가이드"
              >
                📚 가이드
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  isModified ? 'bg-orange-600 text-white hover:bg-orange-700' : 'cursor-not-allowed bg-gray-300 text-gray-500'
                }`}
                onClick={applyChanges}
                disabled={!isModified}
              >
                적용
              </button>
              <button
                className={`rounded px-3 py-1.5 text-sm text-white transition-colors ${saving ? 'cursor-not-allowed bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => window.history.back()} className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-700">
                돌아가기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex min-h-0 flex-1">
        {/* 왼쪽: 미리보기 */}
        <div className="m-2 flex w-1/2 flex-col overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="flex-shrink-0 border-b bg-gray-50 px-4 py-2">
            <h2 className="text-base font-semibold text-gray-900">미리보기</h2>
          </div>
          <div className="flex-1 overflow-auto">
            <iframe
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <style>
                      ${themeContent.themeCss}
                      
                      /* 링크 이동 방지를 위한 스타일 */
                      a {
                        cursor: pointer !important;
                      }
                    </style>
                  </head>
                  <body>
                    ${processTemplate(themeContent.themeHtml, themeContent, homeData)}
                    
                    <script>
                      // 모든 링크의 기본 동작을 방지
                      document.addEventListener('DOMContentLoaded', function() {
                        const links = document.querySelectorAll('a');
                        links.forEach(function(link) {
                          link.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                          });
                        });
                        
                        // 새로운 링크가 동적으로 추가될 경우를 대비한 이벤트 위임
                        document.addEventListener('click', function(e) {
                          if (e.target.tagName === 'A' || e.target.closest('a')) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                          }
                        });
                      });
                    </script>
                  </body>
                </html>
              `}
              className="h-full w-full border-0"
              title="테마 미리보기"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

        {/* 오른쪽: 코드 편집 */}
        <div className="m-2 flex w-1/2 flex-col overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="flex-shrink-0 border-b bg-gray-50 px-4 py-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('html')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setActiveTab('css')}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === 'css' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                CSS
              </button>
            </div>
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={activeTab === 'html' ? 'html' : 'css'}
                theme="vs-dark"
                value={activeTab === 'html' ? editableHtml : editableCss}
                onChange={activeTab === 'html' ? handleHtmlChange : handleCssChange}
                onMount={handleEditorMount}
                options={{
                  fontSize: 13,
                  lineHeight: 1.4,
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  lineDecorationsWidth: 0,
                  lineNumbersMinChars: 3,
                  renderLineHighlight: 'line',
                  contextmenu: true,
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  cursorStyle: 'line',
                  formatOnPaste: true,
                  formatOnType: true,
                  autoIndent: 'advanced',
                  bracketPairColorization: { enabled: true },
                  suggest: {
                    showMethods: true,
                    showFunctions: true,
                    showConstructors: true,
                    showDeprecated: true,
                    showFields: true,
                    showVariables: true,
                    showClasses: true,
                    showStructs: true,
                    showInterfaces: true,
                    showModules: true,
                    showProperties: true,
                    showEvents: true,
                    showOperators: true,
                    showUnits: true,
                    showValues: true,
                    showConstants: true,
                    showEnums: true,
                    showEnumMembers: true,
                    showKeywords: true,
                    showWords: true,
                    showColors: true,
                    showFiles: true,
                    showReferences: true,
                    showFolders: true,
                    showTypeParameters: true,
                    showUsers: true,
                    showIssues: true,
                    showSnippets: true,
                  },
                }}
              />
            </div>

            {/* 하단 상태바 */}
            <div className="flex items-center justify-between border-t bg-gray-100 px-4 py-2 text-xs text-gray-600">
              <span>
                {activeTab === 'html' ? 'HTML' : 'CSS'} •{activeTab === 'html' ? editableHtml.split('\n').length : editableCss.split('\n').length} 줄 •
                {activeTab === 'html' ? editableHtml.length : editableCss.length} 문자
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">Monaco Editor • Ctrl+Enter: 적용 • Ctrl+S: 저장</span>
                {isModified && <span className="font-medium text-orange-600">수정됨</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 가이드 모달 */}
      {showGuide && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900">스킨 편집 가이드</h2>
              <button onClick={() => setShowGuide(false)} className="text-2xl font-bold text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* 왼쪽: 치환자 목록 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">사용 가능한 치환자</h3>
                  <div className="space-y-6">
                    {guideData.variables.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="rounded-lg bg-gray-50 p-4">
                        <h4 className="mb-3 text-base font-medium text-gray-900">{category.category}</h4>
                        <div className="space-y-2">
                          {category.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex flex-col space-y-1">
                              <div className="flex items-center justify-between">
                                <code className="rounded bg-blue-100 px-2 py-1 font-mono text-sm text-blue-800">{item.name}</code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.name);
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800"
                                  title="복사"
                                >
                                  📋
                                </button>
                              </div>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              {item.example && <p className="text-xs text-gray-500 italic">예: {item.example}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* 조건부 블록 섹션 */}
                    {guideData.conditionalBlocks.map((category, categoryIndex) => (
                      <div key={`conditional-${categoryIndex}`} className="rounded-lg border-l-4 border-purple-400 bg-purple-50 p-4">
                        <h4 className="mb-3 text-base font-medium text-purple-900">{category.category}</h4>
                        <div className="space-y-2">
                          {category.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex flex-col space-y-1">
                              <div className="flex items-center justify-between">
                                <code className="rounded bg-purple-100 px-2 py-1 font-mono text-sm text-purple-800">{item.name}</code>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.name);
                                  }}
                                  className="text-sm text-purple-600 hover:text-purple-800"
                                  title="복사"
                                >
                                  📋
                                </button>
                              </div>
                              <p className="text-sm text-purple-600">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 오른쪽: 예시 코드 */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">사용 예시</h3>
                  <div className="space-y-6">
                    {guideData.examples.map((example, index) => (
                      <div key={index} className="rounded-lg bg-gray-50 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{example.title}</h4>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(example.html);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                            title="코드 복사"
                          >
                            📋 복사
                          </button>
                        </div>
                        <p className="mb-3 text-sm text-gray-600">{example.description}</p>
                        <pre className="overflow-x-auto rounded bg-gray-800 p-3 text-xs text-gray-100">
                          <code>{example.html}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 하단 설명 */}
              <div className="mt-8 space-y-4">
                <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
                  <h4 className="mb-2 font-medium text-blue-900">💡 기본 사용법</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>
                      • 치환자는 <code>[##_변수명_##]</code> 형태로 사용합니다.
                    </li>
                    <li>
                      • 반복 블록: <code>&lt;s_태그&gt;</code>와 <code>&lt;/s_태그&gt;</code> 사이에 반복할 내용을 작성합니다.
                    </li>
                    <li>• 조건부 블록: 데이터가 있을 때만 표시되는 영역을 정의합니다.</li>
                    <li>• CSS에서는 치환자를 사용하지 않고 HTML에서만 사용합니다.</li>
                    <li>• 변경 사항은 적용 버튼을 눌러야 미리보기에 반영됩니다.</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-400 bg-green-50 p-4">
                  <h4 className="mb-2 font-medium text-green-900">🎯 페이지 타입별 표시</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>
                      • <code>&lt;s_index_article_rep&gt;</code>: 메인 페이지(글 목록)에서만 표시
                    </li>
                    <li>
                      • <code>&lt;s_article_protected&gt;</code>: 개별 글 페이지에서만 표시
                    </li>
                    <li>
                      • <code>&lt;s_article_comments&gt;</code>: 일반 글(POSTS)에서만 댓글 표시
                    </li>
                    <li>
                      • <code>&lt;s_pagination&gt;</code>: 여러 페이지가 있을 때만 표시
                    </li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-400 bg-purple-50 p-4">
                  <h4 className="mb-2 font-medium text-purple-900">🔄 반복 구조 예시</h4>
                  <div className="text-sm text-purple-800">
                    <p className="mb-2">글 목록을 표시하려면:</p>
                    <pre className="overflow-x-auto rounded bg-purple-100 p-2 text-xs">
                      {`<s_article_rep>
  <article>
    <h2>[##_article_rep_title_##]</h2>
    <p>[##_article_rep_desc_##]</p>
  </article>
</s_article_rep>`}
                    </pre>
                  </div>
                </div>

                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                  <h4 className="mb-2 font-medium text-yellow-900">⚠️ 주의사항</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• 개별 글 페이지에서는 글 목록 관련 치환자가 동작하지 않습니다.</li>
                    <li>• 댓글 시스템은 POSTS 타입 글에서만 활성화됩니다.</li>
                    <li>• 페이지나 공지사항에서는 댓글 입력 폼이 자동으로 숨겨집니다.</li>
                    <li>• 썸네일이나 댓글이 없는 경우 해당 조건부 블록은 표시되지 않습니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end border-t bg-gray-50 px-6 py-4">
              <button onClick={() => setShowGuide(false)} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkinEditorPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">로딩 중...</div>}>
      <SkinEditorContent />
    </Suspense>
  );
}
