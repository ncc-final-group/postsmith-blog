"use client";
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

        // 카테고리와 콘텐츠를 병렬로 가져오기
        const [contentsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/contents?blogId=1'),
          fetch('/api/categories?blogId=1')
        ]);

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
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '미분류';
  };

  const truncateContent = (html: string | null, maxLength: number = 150): string => {
    if (!html) return '';
    // HTML 태그 제거
    const textContent = html.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength 
      ? textContent.substring(0, maxLength) + '...'
      : textContent;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-8 w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-300 rounded mb-2 w-1/4"></div>
                  <div className="h-6 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded mb-2 w-5/6"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">오류 발생</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">블로그 포스트</h1>
          <button
            onClick={() => router.push('/edit')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            새 글 작성
          </button>
        </div>

        {/* 포스트 목록 */}
        {contents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">작성된 포스트가 없습니다</h2>
            <p className="text-gray-500 mb-6">첫 번째 포스트를 작성해보세요!</p>
            <button
              onClick={() => router.push('/edit')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              포스트 작성하기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/posts/${content.sequence}`)}
              >
                {/* 썸네일 영역 */}
                {content.thumbnail && (
                  <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                    <img
                      src={content.thumbnail}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  {/* 카테고리 배지 */}
                  <div className="mb-3">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {getCategoryName(content.category_id)}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {content.title}
                  </h2>

                  {/* 요약 또는 콘텐츠 미리보기 */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {content.summary || truncateContent(content.content_plain || content.content_html)}
                  </p>

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
                      {content.tags.split(',').slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                        >
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