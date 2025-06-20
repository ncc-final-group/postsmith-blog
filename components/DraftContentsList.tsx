'use client';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

interface DraftContent {
  id: number;
  sequence: number;
  title: string;
  postType: 'POSTS' | 'PAGE' | 'NOTICE';
  createdAt: string;
  updatedAt: string;
}

interface DraftContentsListProps {
  contentType: 'POSTS' | 'PAGE' | 'NOTICE';
  onLoadContent?: (content: DraftContent) => void;
}

export default function DraftContentsList({ contentType, onLoadContent }: DraftContentsListProps) {
  const [drafts, setDrafts] = useState<DraftContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchDrafts = useCallback(async () => {
    if (!isOpen) return;

    setIsLoading(true);
    try {
      // 서브도메인 가져오기
      const hostname = window.location.hostname;
      const subdomain = hostname.includes('.') ? hostname.split('.')[0] : null;

      if (!subdomain) {
        setDrafts([]);
        setIsLoading(false);
        return;
      }

      // 서브도메인으로 블로그 정보 조회하여 blogId 확보
      const blogResponse = await fetch(`/api/blog?address=${subdomain}`);
      if (!blogResponse.ok) {
        setDrafts([]);
        setIsLoading(false);
        return;
      }
      const blogData = await blogResponse.json();
      const blogId = blogData?.id || blogData?.data?.id;

      if (!blogId) {
        setDrafts([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/contents/drafts?blogId=${blogId}&type=${contentType}`);
      const result = await response.json();

      if (result.success && result.data) {
        setDrafts(result.data);
      } else {
        setDrafts([]);
      }
    } catch (error) {
      setDrafts([]);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, isOpen]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleLoadDraft = (draft: DraftContent) => {
    if (onLoadContent) {
      onLoadContent(draft);
    } else {
      // 기본 동작: 해당 편집 페이지로 이동 (콘텐츠 타입별 라우팅)
      if (draft.postType === 'POSTS') {
        router.push(`/edit/post/${draft.sequence}`);
      } else if (draft.postType === 'PAGE') {
        router.push(`/edit/page/${draft.sequence}`);
      } else if (draft.postType === 'NOTICE') {
        router.push(`/edit/notice/${draft.sequence}`);
      } else {
        // fallback: contentType 기반
        if (contentType === 'POSTS') {
          router.push(`/edit/post/${draft.sequence}`);
        } else if (contentType === 'PAGE') {
          router.push(`/edit/page/${draft.sequence}`);
        } else if (contentType === 'NOTICE') {
          router.push(`/edit/notice/${draft.sequence}`);
        }
      }
    }
    setIsOpen(false);
  };

  const refreshDrafts = () => {
    fetchDrafts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeName = () => {
    switch (contentType) {
      case 'POSTS':
        return '포스트';
      case 'PAGE':
        return '페이지';
      case 'NOTICE':
        return '공지사항';
      default:
        return '콘텐츠';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:outline-none"
      >
        📄 불러오기
        {drafts.length > 0 && <span className="ml-2 rounded-full bg-blue-500 px-2 py-1 text-xs text-white">{drafts.length}</span>}
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-2 max-h-80 w-96 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-900">임시저장된 {getTypeName()} 목록</h3>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">로딩 중...</div>
          ) : drafts.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">임시저장된 {getTypeName()}이 없습니다.</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {drafts.map((draft) => (
                <div key={draft.id} className="cursor-pointer border-b border-gray-100 p-3 hover:bg-gray-50" onClick={() => handleLoadDraft(draft)}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-gray-900">{draft.title || '제목 없음'}</h4>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(draft.updatedAt)}</p>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">임시저장</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-200 p-3">
            <button onClick={() => setIsOpen(false)} className="w-full rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
