'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: {
    subdomain: string;
    id: string;
  };
}

interface Content {
  id: number;
  blog_id: number;
  sequence: number;
  title: string;
  content_html: string | null;
  content_plain: string | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  type: string;
  is_temp: number;
  is_public: number;
  likes: number;
  views?: number;
  thumbnail?: string;
  summary?: string;
  tags?: string;
}

export default function PostPage({ params }: PageProps) {
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

                 // subdomain 기반으로 자동 감지되는 API 사용 (sequence 기반)
         const response = await fetch(`/api/posts/${params.id}`);
        
        // 블로그가 존재하지 않는 경우 404 처리
        if (response.status === 404) {
          setError('블로그를 찾을 수 없거나 포스트가 존재하지 않습니다.');
          return;
        }
        
        const result = await response.json();

        if (result.success && result.data) {
          setContent(result.data);
        } else {
          setError(result.message || '포스트를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('포스트를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">포스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-4">{error || '포스트를 찾을 수 없습니다.'}</p>
          <Link
            href={`/user-blog/${params.subdomain}`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            블로그로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 블로그 네비게이션 */}
      <div className="mb-8">
        <Link 
          href={`/user-blog/${params.subdomain}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← 블로그로 돌아가기
        </Link>
      </div>

      {/* 포스트 헤더 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-4">
            <time dateTime={content.created_at}>
              {new Date(content.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            <span>❤️ {content.likes}</span>
          </div>
        </div>
      </header>

      {/* 포스트 내용 */}
      <article className="prose prose-lg max-w-none">
        <div 
          className="text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.content_html || '' }}
        />
      </article>

      {/* 포스트 푸터 */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date(content.updated_at).toLocaleDateString('ko-KR')}
          </div>
          <Link 
            href={`/user-blog/${params.subdomain}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            더 많은 포스트 보기 →
          </Link>
        </div>
      </footer>
    </div>
  );
} 