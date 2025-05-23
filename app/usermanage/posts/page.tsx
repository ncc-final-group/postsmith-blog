'use client';

import { BarChart2, ChevronLeft, ChevronRight, Edit, Lock, Search, Settings, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

// Types
interface Post {
  id: number;
  title: string;
  category: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  hasIcon?: boolean;
  isNotice?: boolean;
  commentCount?: number;
  viewCount?: number;
  privacy?: 'public' | 'private';
}

interface BoardData {
  posts: Post[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

type SortType = 'latest' | 'oldest' | 'title' | 'author';

export default function BoardSitePage() {
  const [boardData, setBoardData] = useState<BoardData>({
    posts: [
      {
        id: 1,
        title: 'ㅁㄴㅇ',
        category: '카테고리 없음',
        author: '인생누비',
        createdAt: '2025-05-08T15:21:00Z',
        hasIcon: true,
        viewCount: 42,
        commentCount: 0,
      },
      {
        id: 2,
        title: '환영합니다! ',
        category: '카테고리 없음',
        author: '인생누비',
        createdAt: '2023-09-14T09:36:00Z',
        hasIcon: false,
        viewCount: 156,
        commentCount: 3,
      },
    ],
    totalCount: 2,
    currentPage: 1,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortType>('latest');
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 추가: 마우스 호버 중인 게시물 ID 상태
  const [hoveredPostId, setHoveredPostId] = useState<number | null>(null);

  const formatDate = (dateString: string): string => {
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            글 관리
            <span className="ml-1 rounded-full bg-gray-100 text-sm font-normal text-gray-500">{boardData.totalCount}</span>
          </h1>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-blue-500 hover:text-white"
          >
            <Edit className="h-4 w-4" />
            글쓰기
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl pt-1">
        {/* Search and Filter */}
        <div className="mb-4 flex flex-col items-start gap-4 border border-gray-300 bg-white p-4 sm:flex-row sm:items-center">
          {/* Select All */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPosts.size === boardData.posts.length && boardData.posts.length > 0}
              onChange={() => {}}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">전체선택</span>
          </div>

          {/* Sort & Search */}
          <div className="ml-auto flex items-center gap-3">
            <select
              value={sortOrder}
              onChange={(e) => e.target.value as SortType}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="title">제목순</option>
              <option value="author">작성자순</option>
            </select>

            <form onSubmit={() => {}} className="relative">
              <input
                type="text"
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-700 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button type="submit" className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded p-1 hover:bg-gray-100">
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </form>
          </div>
        </div>
        Posts List
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : boardData.posts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            boardData.posts.map((post, index) => (
              <div
                key={post.id}
                className={`relative cursor-pointer border-b border-gray-200 p-4 transition-colors duration-150 hover:bg-gray-100 ${
                  index === boardData.posts.length - 1 ? 'border-b-0' : ''
                } ${post.isNotice ? 'border-blue-100 bg-blue-50' : ''}`}
                onClick={() => post}
                onMouseEnter={() => setHoveredPostId(post.id)}
                onMouseLeave={() => setHoveredPostId(null)}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.has(post.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      post.id;
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {post.isNotice && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">공지</span>
                      )}
                      <h3 className="truncate font-medium text-gray-900">
                        {post.title}
                        {post.privacy === 'private' && hoveredPostId !== post.id && <Lock className="absolute top-8 right-7 h-4 w-4 text-gray-300" />}
                      </h3>
                      {post.commentCount ? <span className="text-sm font-medium text-blue-600">[{post.commentCount}]</span> : null}
                      {post.hasIcon && <Settings className="h-4 w-4 flex-shrink-0 text-gray-400" />}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium text-orange-600">{post.category}</span>
                      <span>{post.author}</span>
                      <span>{formatDate(post.createdAt)}</span>
                      {post.viewCount && <span>조회 {post.viewCount}</span>}
                    </div>
                  </div>

                  {/* 수정, 삭제, 통계 버튼 + 공개/비공개 select */}
                  {hoveredPostId === post.id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          post;
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="수정"
                      >
                        <Edit className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          post;
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="삭제"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          post;
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="통계"
                      >
                        <BarChart2 className="h-5 w-5 text-gray-600" />
                      </button>

                      {/* 공개/비공개 선택 */}
                      <select
                        className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:border-gray-400 focus:border-gray-400 focus:ring-1 focus:ring-gray-200 focus:outline-none"
                        value={post.privacy || 'public'}
                        onChange={(e) => post}
                        onClick={(e) => e.stopPropagation()} // 클릭 시 부모 이벤트 차단
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
        {/* Pagination */}
        <nav aria-label="Page navigation" className="mt-6 flex items-center justify-center gap-1">
          <button
            onClick={() => boardData.currentPage - 1}
            disabled={boardData.currentPage === 1}
            className="rounded p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => pageNum}
              className={`rounded px-3 py-1 ${boardData.currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => boardData.currentPage + 1}
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
