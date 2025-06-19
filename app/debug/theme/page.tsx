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

export default async function ThemeDebugPage() {
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
        <h1>테마 디버그 정보</h1>

        <h2>블로그 정보</h2>
        <p>
          <strong>ID:</strong> {blog.id}
        </p>
        <p>
          <strong>주소:</strong> {blog.address}
        </p>
        <p>
          <strong>제목:</strong> {blog.nickname}
        </p>

        <h2>테마 정보</h2>
        <p>
          <strong>ID:</strong> {theme.id}
        </p>
        <p>
          <strong>이름:</strong> {theme.name}
        </p>

        <h2>HTML 템플릿</h2>
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
          {theme.html}
        </div>

        <h2>CSS 스타일</h2>
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
          {theme.css}
        </div>

        <h2>토큰 검색</h2>
        <div>
          <p>
            <strong>article_content 토큰 포함 여부:</strong> {theme.html.includes('[##_article_content_##]') ? '✅ 있음' : '❌ 없음'}
          </p>
          <p>
            <strong>article_rep_desc 토큰 포함 여부:</strong> {theme.html.includes('[##_article_rep_desc_##]') ? '✅ 있음' : '❌ 없음'}
          </p>
        </div>
      </div>
    );
  } catch (error) {
    return <div>오류 발생: {String(error)}</div>;
  }
}
