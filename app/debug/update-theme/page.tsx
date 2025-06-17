import { headers } from 'next/headers';

import { getBlogByAddress } from '../../api/tbBlogs';
import { getActiveThemeByBlogId } from '../../api/tbThemes';

async function getBlogAddress(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';

    if (host.includes('.localhost')) {
      const subdomain = host.split('.localhost')[0];
      return subdomain;
    }

    return 'testblog';
  } catch (error) {
    return 'testblog';
  }
}

const updatedThemeHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>[##_page_title_##] | [##_title_##]</title>
  <meta name="description" content="[##_desc_##]" />
  <meta property="og:title" content="[##_page_title_##]" />
  <meta property="og:description" content="[##_desc_##]" />
  <meta property="og:image" content="[##_image_##]" />
  <link rel="stylesheet" href="/static/skin/basic.css" />
</head>

<!-- 페이지 타입에 따라 body id 가 치환됩니다 -->
<body id="[##_body_id_##]">
  <!-- 티스토리 공통 JS 삽입 블록 -->
  <s_t3></s_t3>

  <!-- 헤더 영역 -------------------------------------------------------- -->
  <header class="site-header container mx-auto py-6 flex items-center justify-between">
    <h1 class="text-3xl font-bold">
      <a href="[##_blog_link_##]" class="flex items-center gap-2">
        [##_blog_image_##]  <!-- \`<img src="..." />\` 로 치환 -->
        <span>[##_title_##]</span>
      </a>
    </h1>

    <!-- 메뉴는 관리화면에서 설정된 HTML 로 통째로 치환됩니다 -->
    <nav class="site-nav">
      [##_blog_menu_##]
    </nav>
  </header>

  <!-- 본문 영역 -------------------------------------------------------- -->
  <main class="container mx-auto flex gap-8 py-10">

    <!-- 글 목록 / 글 본문 -->
    <section class="flex-1">
      <!-- 개별 글 페이지 섹션 (새로 추가) -->
      <s_article_protected>
        <div class="single-post">
          <article class="post-content">
            <header class="post-header mb-8">
              <h1 class="post-title text-4xl font-bold mb-4">[##_article_title_##]</h1>
              <div class="post-meta text-sm text-gray-500 mb-4">
                <time datetime="[##_article_date_##]">[##_article_date_##]</time>
                · <span class="post-author">[##_article_author_##]</span>
                · <span class="post-category">[##_article_category_##]</span>
              </div>
            </header>
            
            <div class="post-body prose max-w-none">
              [##_article_content_##]
            </div>
            
            <footer class="post-footer mt-8 pt-8 border-t">
              <div class="post-navigation flex justify-between">
                <div class="prev-post">
                  [##_article_prev_##]
                </div>
                <div class="next-post">
                  [##_article_next_##]
                </div>
              </div>
            </footer>
          </article>
        </div>
      </s_article_protected>

      <!-- 홈/카테고리/태그 등에서 글 카드 반복 -->
      <s_article_rep>
        <article class="post-card border-b py-6">
          <a href="[##_article_rep_link_##]" class="block hover:opacity-80">
            <h2 class="text-2xl font-semibold mb-2">[##_article_rep_title_##]</h2>

            <!-- 대표 이미지가 있을 때만 썸네일 그룹 치환 -->
            <s_article_rep_thumbnail>
              <img src="[##_article_rep_thumbnail_url_##]" alt="thumbnail" class="w-full h-56 object-cover rounded" />
            </s_article_rep_thumbnail>

            <p class="text-sm text-gray-500 mt-2">
              <time datetime="[##_article_rep_date_##]">[##_article_rep_simple_date_##]</time>
              · <a href="[##_article_rep_category_link_##]">[##_article_rep_category_##]</a>
              · <s_rp_count>[##_article_rep_rp_cnt_##] 댓글</s_rp_count>
            </p>

            <p class="mt-4 text-gray-700 line-clamp-3">[##_article_rep_desc_##]</p>
          </a>
        </article>
      </s_article_rep>
    </section>

    <!-- 사이드바 ------------------------------------------------------- -->
    <aside id="sidebar" class="w-80 space-y-8">
      <s_sidebar>
        <!-- 오른쪽 사이드바 -->
        <s_sidebar_element>
          <!-- 카테고리 -->
          <div class="widget">
            <h3 class="widget-title">카테고리</h3>
            [##_category_##]
          </div>
        </s_sidebar_element>

        <s_sidebar_element>
          <!-- 최근 글 -->
          <div class="widget">
            <h3 class="widget-title">최근 글</h3>
            <ul class="space-y-2">
              <s_rctps_rep>
                <li class="flex items-center gap-2">
                  <s_rctps_rep_thumbnail>
                    <img src="[##_rctps_rep_thumbnail_##]" class="w-12 h-12 object-cover rounded" />
                  </s_rctps_rep_thumbnail>
                  <a href="[##_rctps_rep_link_##]" class="flex-1 line-clamp-1">[##_rctps_rep_title_##]</a>
                  <span class="text-sm text-gray-400">[##_rctps_rep_rp_cnt_##]</span>
                </li>
              </s_rctps_rep>
            </ul>
          </div>
        </s_sidebar_element>

        <s_sidebar_element>
          <!-- 최근 댓글 -->
          <div class="widget">
            <h3 class="widget-title">최근 댓글</h3>
            <ul class="space-y-2">
              <s_rctrp_rep>
                <li>
                  <a href="[##_rctrp_rep_link_##]" class="block line-clamp-1">[##_rctrp_rep_desc_##]</a>
                  <span class="text-xs text-gray-500">[##_rctrp_rep_name_##] · [##_rctrp_rep_time_##]</span>
                </li>
              </s_rctrp_rep>
            </ul>
          </div>
        </s_sidebar_element>
      </s_sidebar>
    </aside>
  </main>

  <!-- 푸터 ------------------------------------------------------------- -->
  <footer class="site-footer py-8 text-center text-sm text-gray-500">
    &copy; <script>document.write(new Date().getFullYear())</script> [##_title_##] · Powered by PostSmith
  </footer>
</body>
</html>`;

export default async function UpdateThemePage() {
  try {
    const subdomain = await getBlogAddress();
    const blog = await getBlogByAddress(subdomain);

    if (!blog) {
      return <div>블로그를 찾을 수 없습니다.</div>;
    }

    const theme = await getActiveThemeByBlogId(blog.id);

    if (!theme) {
      return <div>테마를 찾을 수 없습니다.</div>;
    }

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>테마 업데이트</h1>

        <h2>현재 테마 정보</h2>
        <p>
          <strong>ID:</strong> {theme.id}
        </p>
        <p>
          <strong>이름:</strong> {theme.name}
        </p>

        <h2>업데이트할 HTML</h2>
        <div
          style={{
            background: '#f5f5f5',
            padding: '10px',
            border: '1px solid #ddd',
            whiteSpace: 'pre-wrap',
            fontSize: '12px',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {updatedThemeHtml}
        </div>

        <h2>변경사항</h2>
        <ul>
          <li>✅ 개별 글 페이지 섹션 추가 (&lt;s_article_protected&gt;)</li>
          <li>✅ [##_article_content_##] 토큰 추가</li>
          <li>✅ [##_article_title_##] 토큰 추가</li>
          <li>✅ [##_article_date_##] 토큰 추가</li>
          <li>✅ [##_article_author_##] 토큰 추가</li>
          <li>✅ [##_article_category_##] 토큰 추가</li>
          <li>✅ [##_article_prev_##], [##_article_next_##] 토큰 추가</li>
        </ul>

        <div style={{ marginTop: '20px', padding: '10px', background: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <p>
            <strong>주의:</strong> 이 HTML을 데이터베이스의 themes 테이블에 직접 업데이트해야 합니다.
          </p>
          <p>테마 ID: {theme.id}</p>
        </div>
      </div>
    );
  } catch (error) {
    return <div>오류 발생: {String(error)}</div>;
  }
}
