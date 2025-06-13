'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

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
  views: number;
  thumbnail?: string;
  summary?: string;
  tags?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function PostsListPage() {
  const router = useRouter();
  const [contents, setContents] = useState<Content[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 카테고리와 콘텐츠를 병렬로 가져오기 (subdomain 기반으로 자동 감지)
        const [contentsResponse, categoriesResponse] = await Promise.all([fetch('/api/contents'), fetch('/api/categories')]);

        // 블로그가 존재하지 않는 경우 404 처리
        if (contentsResponse.status === 404 || categoriesResponse.status === 404) {
          setError('블로그를 찾을 수 없습니다. 올바른 블로그 주소인지 확인해주세요.');
          return;
        }

        const contentsResult = await contentsResponse.json();
        const categoriesResult = await categoriesResponse.json();

        if (contentsResult.success && contentsResult.data) {
          setContents(contentsResult.data);
        }

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return '미분류';
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : '미분류';
  };

  const truncateContent = (html: string | null, maxLength: number = 150): string => {
    if (!html) return '';
    // HTML 태그 제거
    const textContent = html.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength ? textContent.substring(0, maxLength) + '...' : textContent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-1/3 rounded bg-gray-300"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="mb-2 h-4 w-1/4 rounded bg-gray-300"></div>
                  <div className="mb-4 h-6 rounded bg-gray-300"></div>
                  <div className="mb-2 h-4 rounded bg-gray-300"></div>
                  <div className="mb-2 h-4 w-5/6 rounded bg-gray-300"></div>
                  <div className="h-4 w-3/4 rounded bg-gray-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">오류 발생</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <button onClick={() => window.location.reload()} className="rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">블로그 포스트</h1>
          <button onClick={() => router.push('/edit')} className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700">
            새 글 작성
          </button>
        </div>

        {/* 포스트 목록 */}
        {contents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-4 text-6xl text-gray-400">📝</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-600">작성된 포스트가 없습니다</h2>
            <p className="mb-6 text-gray-500">첫 번째 포스트를 작성해보세요!</p>
            <button onClick={() => router.push('/edit')} className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700">
              포스트 작성하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contents.map((content) => (
              <div
                key={content.id}
                className="cursor-pointer rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
                onClick={() => router.push(`/posts/${content.sequence}`)}
              >
                {/* 썸네일 영역 */}
                {content.thumbnail && (
                  <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-200">
                    <img src={content.thumbnail} alt={content.title} className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="p-6">
                  {/* 카테고리 배지 */}
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">{getCategoryName(content.category_id)}</span>
                  </div>

                  {/* 제목 */}
                  <h2 className="mb-3 line-clamp-2 text-xl font-bold text-gray-900">{content.title}</h2>

                  {/* 요약 또는 콘텐츠 미리보기 */}
                  <p className="mb-4 line-clamp-3 text-sm text-gray-600">{content.summary || truncateContent(content.content_plain || content.content_html)}</p>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(content.created_at).toLocaleDateString('ko-KR')}</span>
                    <div className="flex items-center space-x-3">
                      <span>👁️ {content.views}</span>
                      <span>❤️ {content.likes}</span>
                      {/* <span>💬 {content.comments_count}</span> */}
                    </div>
                  </div>

                  {/* 태그 */}
                  {content.tags && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {content.tags
                        .split(',')
                        .slice(0, 3)
                        .map((tag, index) => (
                          <span key={index} className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            #{tag.trim()}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
