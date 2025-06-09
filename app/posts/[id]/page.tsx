"use client";
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
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

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postId = params.id as string;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // 블로그 ID는 1로 고정, content_sequence는 URL의 [id] 사용
        const response = await fetch(`/api/posts/${postId}?blogId=1`);
        const result = await response.json();

        if (result.success && result.data) {
          setContent(result.data);
          
          // 카테고리 정보도 가져오기
          if (result.data.category_id) {
            const categoryResponse = await fetch(`/api/categories/${result.data.category_id}`);
            const categoryResult = await categoryResponse.json();
            if (categoryResult.success && categoryResult.data) {
              setCategory(categoryResult.data);
            }
          }
        } else {
          setError(result.message || '게시글을 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchContent();
    }
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">게시글을 불러오는 중...</p>
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
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">게시글을 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">요청하신 게시글이 존재하지 않습니다.</p>
          <button
            onClick={() => router.push('/posts')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            게시글 목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800 flex items-center"
            >
              ← 뒤로 가기
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/edit?id=${postId}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => {
                  if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                    // 삭제 로직 구현 필요
                    alert('삭제 기능은 아직 구현되지 않았습니다.');
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>

          {/* 카테고리 배지 */}
          {category && (
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {category.name}
              </span>
            </div>
          )}

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>

          {/* 메타 정보 */}
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <span>작성일: {new Date(content.created_at).toLocaleDateString('ko-KR')}</span>
            {content.updated_at !== content.created_at && (
              <span>수정일: {new Date(content.updated_at).toLocaleDateString('ko-KR')}</span>
            )}
            <span>조회수: {content.views}</span>
            <span>좋아요: {content.likes}</span>
            {/* <span>댓글: {content.comments_count}</span> */}
          </div>

          {/* 요약 */}
          {content.summary && (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">요약</h3>
              <p className="text-gray-700">{content.summary}</p>
            </div>
          )}

          {/* 태그 */}
          {content.tags && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {content.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 게시글 내용 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <style jsx global>{`
            /* 코드 블럭 스타일 - 에디터와 동일하게 */
            .editor-content code {
              display: block;
              background-color: #f1f5f9;
              color: #475569;
              padding: 16px;
              border-radius: 8px;
              font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Ubuntu Mono', monospace !important;
              font-size: 14px !important;
              border: 1px solid #e2e8f0;
              margin: 16px 0;
              overflow-x: auto;
              line-height: 1.4;
              white-space: pre-wrap;
              font-weight: normal !important;
            }

            .editor-content pre {
              background-color: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              overflow-x: auto;
              margin: 16px 0;
              font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Ubuntu Mono', monospace !important;
              font-size: 14px !important;
              line-height: 1.4;
              font-weight: normal !important;
            }

            .editor-content pre code {
              display: block;
              background-color: transparent;
              border: none;
              padding: 0;
              margin: 0;
              color: #475569;
              font-family: inherit !important;
              font-size: inherit !important;
              font-weight: inherit !important;
            }
          `}</style>
          <div 
            className="prose max-w-none editor-content"
            dangerouslySetInnerHTML={{ __html: content.content_html || content.content_plain || '내용이 없습니다.' }}
          />
        </div>

        {/* 하단 네비게이션 */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => router.push('/posts')}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            목록으로
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => router.push(`/edit?id=${postId}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              수정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 