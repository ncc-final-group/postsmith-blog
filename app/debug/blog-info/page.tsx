import { headers } from 'next/headers';

import { getBlogByAddress } from '../../api/tbBlogs';

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

export default async function BlogInfoDebugPage() {
  try {
    const subdomain = await getBlogAddress();
    const blog = await getBlogByAddress(subdomain);

    if (!blog) {
      return <div>블로그를 찾을 수 없습니다. 주소: {subdomain}</div>;
    }

    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>블로그 정보 디버그</h1>

        <h2>URL 정보</h2>
        <p>
          <strong>추출된 주소:</strong> {subdomain}
        </p>

        <h2>데이터베이스에서 가져온 블로그 정보</h2>
        <div style={{ background: '#f5f5f5', padding: '10px', border: '1px solid #ddd' }}>
          <p>
            <strong>ID:</strong> {blog.id}
          </p>
          <p>
            <strong>Nickname:</strong> &quot;{blog.nickname}&quot; (타입: {typeof blog.nickname})
          </p>
          <p>
            <strong>Description:</strong> &quot;{blog.description}&quot; (타입: {typeof blog.description})
          </p>
          <p>
            <strong>Address:</strong> &quot;{blog.address}&quot; (타입: {typeof blog.address})
          </p>
          <p>
            <strong>Logo Image:</strong> &quot;{blog.logo_image}&quot; (타입: {typeof blog.logo_image})
          </p>
          <p>
            <strong>Created At:</strong> {blog.created_at}
          </p>
          <p>
            <strong>Updated At:</strong> {blog.updated_at}
          </p>
        </div>

        <h2>템플릿 데이터로 변환된 정보</h2>
        <div style={{ background: '#e8f5e8', padding: '10px', border: '1px solid #4caf50' }}>
          <p>
            <strong>Nickname:</strong> &quot;{String(blog.nickname)}&quot;
          </p>
          <p>
            <strong>Description:</strong> &quot;{blog.description ? String(blog.description) : null}&quot;
          </p>
          <p>
            <strong>Address:</strong> &quot;{String(blog.address)}&quot;
          </p>
        </div>

        <h2>원시 데이터 (JSON)</h2>
        <pre
          style={{
            background: '#f5f5f5',
            padding: '10px',
            border: '1px solid #ddd',
            fontSize: '12px',
            overflow: 'auto',
          }}
        >
          {JSON.stringify(blog, null, 2)}
        </pre>
      </div>
    );
  } catch (error) {
    return <div>오류 발생: {String(error)}</div>;
  }
}
