'use client';

import clsx from 'clsx';
import { Captions, ChevronLeft, ChevronRight, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

// Types
interface Comments {
  repliesId: number;
  userName: string;
  parentReplyId?: number;
  replyContent: string;
  contentTitle: string;
  createdAt: string;
  isNotice?: boolean;
  privacy?: 'public' | 'private';
}

interface CommentData {
  comments: Comments[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

type SortType = 'latest' | 'oldest';

export default function CommentsData() {
  const [commentData, setCommentData] = useState<CommentData>({
    comments: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
  });
  const [sortOrder, setSortOrder] = useState<SortType>('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComments, setSelectedComments] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);
  const [filterReply, setFilterReply] = useState<'all' | 'true' | 'false'>('all');

  // ✅ 서버에서 댓글 데이터 불러오기
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('http://localhost:8088/api/Replies'); // 주소 맞게 조정
        const data = await res.json();
        setCommentData({
          comments: data,
          totalCount: data.length,
          currentPage: 1,
          totalPages: 1,
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('댓글을 불러오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
      2,
      '0',
    )} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const filteredAndSortedComments = useMemo(() => {
    let comments = [...commentData.comments];

    // ✅ 댓글/답글 필터링
    if (filterReply === 'true') {
      comments = comments.filter((c) => c.parentReplyId === null); // 댓글만
    } else if (filterReply === 'false') {
      comments = comments.filter((c) => c.parentReplyId !== null); // 답글만
    }

    // 정렬
    comments.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === 'latest') return dateB - dateA;
      if (sortOrder === 'oldest') return dateA - dateB;
      return 0;
    });

    return comments;
  }, [commentData.comments, sortOrder, filterReply]);

  const getPageNumbers = (): number[] => {
    const { currentPage, totalPages } = commentData;
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
    const allSelected = selectedComments.size === commentData.comments.length;
    if (allSelected) {
      setSelectedComments(new Set());
    } else {
      const allIds = commentData.comments.map((c) => c.repliesId);
      setSelectedComments(new Set(allIds));
    }
  };

  const handleReplyToReply = (comment: Comments) => {
    alert(`답글 기능: ${comment.contentTitle}`);
  };

  async function handleDeletePost(comment: Comments) {
    const confirmed = confirm(`정말 삭제하시겠습니까? (${comment.replyContent})`);
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:8088/api/Replies/delete/${comment.repliesId}`, { method: 'DELETE' });

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      // 프론트 상태 동기화
      setCommentData((prev) => ({
        ...prev,
        comments: prev.comments.filter((c) => c.repliesId !== comment.repliesId),
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('삭제 요청 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= commentData.totalPages) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setCommentData((prev) => ({
          ...prev,
          currentPage: page,
        }));
      }, 500);
    }
  };

  const handlePostClick = (comment: Comments) => {
    alert(`댓글 클릭: ${comment.contentTitle}`);
  };
  async function handleBulkAction(action: string) {
    if (selectedComments.size === 0) {
      alert('먼저 댓글을 선택하세요.');
      return;
    }

    if (action === 'delete') {
      if (!confirm('선택된 댓글을 삭제하시겠습니까?')) return;

      try {
        const idsToDelete = Array.from(selectedComments);

        const res = await fetch('http://localhost:8088/api/Replies/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(idsToDelete),
        });

        if (!res.ok) {
          throw new Error(`서버 응답 오류: ${res.status}`);
        }

        setCommentData((prev) => ({
          ...prev,
          comments: prev.comments.filter((comment) => !selectedComments.has(comment.repliesId)),
        }));
        setSelectedComments(new Set());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('삭제 요청 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-none">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            댓글 관리
            <span className="ml-1 rounded-full bg-gray-100 text-sm font-normal text-gray-500">{commentData.totalCount}</span>
          </h1>
        </div>
      </div>

      <div className="max-w-none pt-1">
        <div className="mb-4 flex flex-col items-start gap-4 border border-gray-300 bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedComments.size === commentData.comments.length && commentData.comments.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">전체선택</span>
            <select
              defaultValue=""
              onChange={(e) => handleBulkAction(e.target.value)}
              className={clsx(
                'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700',
                'hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none',
              )}
            >
              <option value="" disabled>
                일괄 작업 선택
              </option>
              <option value="delete">삭제</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex gap-2">
              {/* 정렬 선택 */}
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortType)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
              {/*댓글/답글 정렬 */}
              <select
                value={filterReply}
                onChange={(e) => setFilterReply(e.target.value as 'all' | 'true' | 'false')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <optgroup label="댓글/답글 보기">
                  <option value="all">전체보기</option>
                  <option value="true">댓글만</option>
                  <option value="false">답글만</option>
                </optgroup>
              </select>
            </div>
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
          ) : commentData.comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            filteredAndSortedComments.map((comment, index) => (
              <div
                key={comment.repliesId}
                className={`relative cursor-pointer border-b border-gray-200 p-4 transition-colors duration-150 hover:bg-gray-100 ${
                  index === commentData.comments.length - 1 ? 'border-b-0' : ''
                } ${comment.isNotice ? 'border-blue-100 bg-blue-50' : ''}`}
                onClick={() => handlePostClick(comment)}
                onMouseEnter={() => setHoveredCommentId(comment.repliesId)}
                onMouseLeave={() => setHoveredCommentId(null)}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedComments.has(comment.repliesId)}
                    onChange={() => handleSelectOne(comment.repliesId)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="text-orange-600">{comment.userName}</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>

                    <div className="mt-2 mb-3 flex items-center gap-2">
                      {comment && (
                        <span
                          className={clsx(
                            'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                            comment.parentReplyId ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800',
                          )}
                        >
                          {comment.parentReplyId ? '답글' : '댓글'}
                        </span>
                      )}
                      <h3 className="relative truncate text-sm font-light text-black">{comment.replyContent}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Captions className="h-4 w-4 text-gray-300" />
                      <p className="truncate text-xs text-gray-700">{comment.contentTitle}</p>
                    </div>
                  </div>

                  {hoveredCommentId === comment.repliesId && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReplyToReply(comment);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="답글"
                      >
                        <Captions className="h-5 w-5 text-blue-600" />
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
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <nav aria-label="Page navigation" className="mt-6 flex items-center justify-center gap-1">
          <button
            onClick={() => handlePageChange(commentData.currentPage - 1)}
            disabled={commentData.currentPage === 1}
            className="rounded p-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            title="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`rounded px-3 py-1 ${commentData.currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(commentData.currentPage + 1)}
            disabled={commentData.currentPage === commentData.totalPages}
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
