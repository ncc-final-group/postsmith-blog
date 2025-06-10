'use client';

import clsx from 'clsx';
import { BarChart2, Captions, ChevronLeft, ChevronRight, Edit, Search, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

// Types
interface Comments {
  id: number;
  title: string;
  author: string;
  createdAt: string;
  hasIcon?: boolean;
  content?: string;
  privacy?: 'public' | 'private';
  viewCount?: number;
  isNotice?: boolean;
}

interface BoardData {
  comments: Comments[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

type SortType = 'latest' | 'oldest' | 'title' | 'author';

export default function BoardSitePage() {
  const [boardData, setBoardData] = useState<BoardData>({
    comments: [
      {
        id: 1,
        title: 'ㅁㄴㅇ',
        author: '인생누비',
        createdAt: '2025-05-08T15:21:00Z',
        hasIcon: true,
        content: '글 진짜 너무 못 쓰시네요 ㅠㅠ',
      },
      {
        id: 2,
        title: '환영합니다!',
        author: '인생누비',
        createdAt: '2023-09-14T09:36:00Z',
        hasIcon: false,
        content: '알빠 쓰레빠?',
      },
    ],
    totalCount: 2,
    currentPage: 1,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortType>('latest');
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
      2,
      '0',
    )} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getPageNumbers = (): number[] => {
    const { currentPage, totalPages } = boardData;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handleSelectOne = (commentId: number) => {
    setSelectedComments((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(commentId)) {
        newSelected.delete(commentId);
      } else {
        newSelected.add(commentId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allSelected = selectedComments.size === boardData.comments.length;
    if (allSelected) {
      setSelectedComments(new Set());
    } else {
      const allIds = boardData.comments.map((c) => c.id);
      setSelectedComments(new Set(allIds));
    }
  };

  const handleEditPost = (comment: Comments) => {
    alert(`수정: ${comment.title}`);
  };

  const handleDeletePost = (comment: Comments) => {
    if (confirm(`정말 삭제하시겠습니까? (${comment.title})`)) {
      setBoardData((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.id !== comment.id),
      }));
    }
  };

  const handleViewStats = (comment: Comments) => {
    alert(`통계 보기: ${comment.title}`);
  };

  const handleSortChange = (newSort: SortType) => {
    setSortOrder(newSort);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= boardData.totalPages) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setBoardData((prev) => ({
          ...prev,
          currentPage: page,
        }));
      }, 500);
    }
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLSelectElement>, comment: Comments) => {
    const newPrivacy = e.target.value as 'public' | 'private';
    setBoardData((prev) => ({
      ...prev,
      comments: prev.comments.map((c) => (c.id === comment.id ? { ...c, privacy: newPrivacy } : c)),
    }));
  };

  const handlePostClick = (comment: Comments) => {
    alert(`게시글 클릭: ${comment.title}`);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-none">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            댓글 관리
            <span className="ml-1 rounded-full bg-gray-100 text-sm font-normal text-gray-500">{boardData.totalCount}</span>
          </h1>
        </div>
      </div>

      <div className="max-w-none pt-1">
        <div className="mb-4 flex flex-col items-start gap-4 border border-gray-300 bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedComments.size === boardData.comments.length && boardData.comments.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">전체선택</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={clsx(
                  'w-48 rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-700',
                  'hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none',
                )}
              />
              <button type="button" className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded p-1 hover:bg-gray-100">
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : boardData.comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            boardData.comments.map((comment, index) => (
              <div
                key={comment.id}
                className={`relative cursor-pointer border-b border-gray-200 p-4 transition-colors duration-150 hover:bg-gray-100 ${
                  index === boardData.comments.length - 1 ? 'border-b-0' : ''
                } ${comment.isNotice ? 'border-blue-100 bg-blue-50' : ''}`}
                onClick={() => handlePostClick(comment)}
                onMouseEnter={() => setHoveredCommentId(comment.id)}
                onMouseLeave={() => setHoveredCommentId(null)}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedComments.has(comment.id)}
                    onChange={() => handleSelectOne(comment.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="text-orange-600">{comment.author}</span>
                      <span>{formatDate(comment.createdAt)}</span>
                      {comment.viewCount && <span>조회 {comment.viewCount}</span>}
                    </div>

                    <div className="mt-2 mb-3 flex items-center gap-2">
                      <h3 className="relative truncate text-sm font-light text-black">{comment.content}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Captions className="h-4 w-4 text-gray-300" />
                      <p className="truncate text-xs text-gray-700">{comment.title}</p>
                    </div>
                  </div>

                  {hoveredCommentId === comment.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(comment);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="수정"
                      >
                        <Edit className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePost(comment);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="삭제"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStats(comment);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="통계"
                      >
                        <BarChart2 className="h-5 w-5 text-gray-600" />
                      </button>
                      <select
                        className={clsx(
                          'rounded border border-gray-300 px-2 py-1 text-sm text-gray-700',
                          'hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 focus:outline-none',
                        )}
                        value={comment.privacy || 'public'}
                        onChange={(e) => handlePrivacyChange(e, comment)}
                        onClick={(e) => e.stopPropagation()}
                        title="공개/비공개 설정"
                      >
                        <option value="public">공개</option>
                        <option value="private">비공개</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <nav aria-label="Page navigation" className="mt-6 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(boardData.currentPage - 1)}
            disabled={boardData.currentPage === 1}
            className="rounded p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`rounded px-3 py-1 ${boardData.currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(boardData.currentPage + 1)}
            disabled={boardData.currentPage === boardData.totalPages}
            className="rounded p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="다음 페이지"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );
}
