'use client';

import clsx from 'clsx';
import { BarChart2, ChevronLeft, ChevronRight, Edit, Lock, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

// Types
interface NOTICE {
  contentId: number;
  userNickname: string;
  contentType: string;
  title: string;
  isPublic: boolean;
  likes: number;
  createdAt: string;
  categoryid?: string;
  categoryName?: string;
  categoryPath?: string;
  totalViewCount: number;
  totalRepliesCount: number;
}

interface BoardData {
  notices: NOTICE[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

type SortType = 'latest' | 'oldest';

export default function BoardSitePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortType>('latest');
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'true' | 'false'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  const [selectedNotices, setSelectedNotices] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredNoticeId, setHoveredNoticeId] = useState<number | null>(null);
  const [boardData, setBoardData] = useState<BoardData>({
    notices: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
  });

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(boardData.notices.map((notice) => notice.categoryName).filter(Boolean)));
  }, [boardData.notices]);

  const filteredAndSortedNotices = useMemo(() => {
    let notices = [...boardData.notices];

    if (searchTerm.trim() !== '') {
      notices = notices.filter((notice) => notice.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 공개/비공개 필터
    if (filterPrivacy !== 'all') {
      notices = notices.filter((notice) => String(notice.isPublic) === filterPrivacy);
    }
    if (selectedCategory !== 'all') {
      notices = notices.filter((notice) => notice.categoryName === selectedCategory);
    }

    // 정렬
    notices.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === 'latest') return dateB - dateA;
      if (sortOrder === 'oldest') return dateA - dateB;
      return 0;
    });

    return notices;
  }, [boardData.notices, sortOrder, filterPrivacy, selectedCategory, searchTerm]);

  const NOTICES_PER_PAGE = 5;

  useEffect(() => {
    const blogId = 2;
    setIsLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/NOTICE?blogId=${blogId}`)
      .then((res) => {
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then((data: NOTICE[]) => {
        const totalCount = data.length;
        const totalPages = Math.ceil(totalCount / NOTICES_PER_PAGE);
        const currentPage = 1;

        const paginatedNotices = data.slice((currentPage - 1) * NOTICES_PER_PAGE, currentPage * NOTICES_PER_PAGE);

        setBoardData({
          notices: paginatedNotices,
          totalCount,
          currentPage,
          totalPages,
        });
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('게시글을 불러오는 중 오류 발생:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
      2,
      '0',
    )} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function getPageNumbers(): number[] {
    const { currentPage, totalPages } = boardData;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }

  function handleCreateNotice() {
    alert('글쓰기 기능은 아직 구현되지 않았습니다.');
  }

  function handleNoticeClick(notice: NOTICE) {}

  function handleSelectOne(noticeId: number) {
    setSelectedNotices((prev) => {
      const newSelectedNotices = new Set(prev);
      if (newSelectedNotices.has(noticeId)) {
        newSelectedNotices.delete(noticeId);
      } else {
        newSelectedNotices.add(noticeId);
      }
      return newSelectedNotices;
    });
  }

  function handleSelectAll() {
    const allSelected = selectedNotices.size === boardData.notices.length;
    if (allSelected) {
      setSelectedNotices(new Set());
    } else {
      const allIds = boardData.notices.map((notice) => notice.contentId);
      setSelectedNotices(new Set(allIds));
    }
  }

  function handleEditNotice(notice: NOTICE) {
    alert(`수정: ${notice.title}`);
  }

  function handleViewStats(notice: NOTICE) {
    router.push(`/visits/${notice.contentId}`);
  }

  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > boardData.totalPages) return;

    const start = (pageNum - 1) * NOTICES_PER_PAGE;
    const end = pageNum * NOTICES_PER_PAGE;

    const blogId = 2;
    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/NOTICE?blogId=${blogId}`)
      .then((res) => res.json())
      .then((data: NOTICE[]) => {
        const filteredNotices = data.filter((notice) => notice.contentType === 'NOTICE');
        const paginatedNotices = filteredNotices.slice(start, end);

        setBoardData((prev) => ({
          ...prev,
          notices: paginatedNotices,
          currentPage: pageNum,
        }));
      });
  };

  async function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>, notice: NOTICE) {
    const newPrivacy = e.target.value === 'true';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/${notice.contentId}/privacy?isPublic=${newPrivacy}`, { method: 'PATCH' });

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      setBoardData((prev) => ({
        ...prev,
        notices: prev.notices.map((p) => (p.contentId === notice.contentId ? { ...p, isPublic: newPrivacy } : p)),
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('공개 여부 변경 실패:', error);
      alert('공개 여부 변경에 실패했습니다.');
    }
  }

  async function handleDeleteNotices(notice: NOTICE) {
    const confirmed = confirm(`정말 삭제하시겠습니까? (${notice.title})`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/delete/${notice.contentId}`, { method: 'DELETE' });

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      // 프론트 상태 동기화
      setBoardData((prev) => ({
        ...prev,
        notices: prev.notices.filter((p) => p.contentId !== notice.contentId),
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('삭제 요청 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  }

  async function handleBulkAction(action: string) {
    if (selectedNotices.size === 0) {
      alert('먼저 게시글을 선택하세요.');
      return;
    }

    if (action === 'delete') {
      if (!confirm('선택된 게시글을 삭제하시겠습니까?')) return;

      try {
        const idsToDelete = Array.from(selectedNotices);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/delete`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(idsToDelete),
        });

        if (!res.ok) {
          throw new Error(`서버 응답 오류: ${res.status}`);
        }

        setBoardData((prev) => ({
          ...prev,
          notices: prev.notices.filter((notice) => !selectedNotices.has(notice.contentId)),
        }));
        setSelectedNotices(new Set());
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('삭제 요청 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    } else if (action === 'makePublic' || action === 'makePrivate') {
      const newPrivacy = action === 'makePublic';
      const contentIds = Array.from(selectedNotices);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/privacy`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentIds, isPublic: newPrivacy }),
        });

        if (!res.ok) {
          throw new Error(`서버 응답 오류: ${res.status}`);
        }

        // UI 반영
        setBoardData((prev) => ({
          ...prev,
          notices: prev.notices.map((notice) => (selectedNotices.has(notice.contentId) ? { ...notice, isPublic: newPrivacy } : notice)),
        }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('공개/비공개 변경 실패:', error);
        alert('공개/비공개 변경에 실패했습니다.');
      }
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            공지 관리
            <span className="ml-1 rounded-full bg-gray-100 text-sm font-normal text-gray-500">{boardData.totalCount}</span>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {filterPrivacy === 'all' ? '전체' : filterPrivacy === 'true' ? '공개' : '비공개'} /{selectedCategory === 'all' ? '전체' : selectedCategory}
            </span>
          </h1>
          <button
            onClick={handleCreateNotice}
            className={clsx(
              'flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2',
              'text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-blue-500 hover:text-white',
            )}
          >
            <Edit className="h-4 w-4" />
            글쓰기
          </button>
        </div>
      </div>

      <div className="max-w-none pt-1">
        <div className="mb-4 flex flex-col items-start gap-4 border border-gray-300 bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedNotices.size === boardData.notices.length && boardData.notices.length > 0}
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
              <option value="makePublic">공개</option>
              <option value="makePrivate">비공개</option>
              <option value="delete">삭제</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex gap-2">
              {/* 정렬 선택 */}
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortType)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>

              {/* 공개/비공개 필터 */}
              <select
                value={`${filterPrivacy}|${selectedCategory}`}
                onChange={(e) => {
                  const [privacy, category] = e.target.value.split('|');
                  setFilterPrivacy(privacy as 'all' | 'true' | 'false');
                  setSelectedCategory(category);
                }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <optgroup label="공개 설정">
                  <option value="all|all">전체 보기</option>
                  <option value="true|all">공개만 보기</option>
                  <option value="false|all">비공개만 보기</option>
                </optgroup>

                <optgroup label="카테고리 필터">
                  <option value={`${filterPrivacy}|all`}>전체 카테고리</option>
                  {uniqueCategories.map((category) => (
                    <option key={category} value={`${filterPrivacy}|${category}`}>
                      {category}
                    </option>
                  ))}
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
          ) : boardData.notices.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            filteredAndSortedNotices.map((notice, index) => (
              <div
                key={notice.contentId}
                className={`relative cursor-pointer border-b border-gray-200 p-4 transition-colors duration-150 hover:bg-gray-100 ${index === boardData.notices.length - 1 ? 'border-b-0' : ''}`}
                onClick={() => handleNoticeClick(notice)}
                onMouseEnter={() => setHoveredNoticeId(notice.contentId)}
                onMouseLeave={() => setHoveredNoticeId(null)}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedNotices.has(notice.contentId)}
                    onChange={() => handleSelectOne(notice.contentId)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {notice.contentType && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">{notice.contentType}</span>
                      )}
                      <h3 className="relative truncate font-medium text-gray-900">{notice.title}</h3>
                      {notice.isPublic === false && hoveredNoticeId !== notice.contentId && <Lock className="absolute top-8 right-9 h-4 w-4 text-gray-400" />}

                      {notice.totalRepliesCount ? <span className="text-sm font-medium text-blue-600">[{notice.totalRepliesCount}]</span> : null}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium text-orange-600">{notice.categoryPath || 'no category'}</span>

                      <span>{notice.userNickname}</span>
                      <span>{formatDate(notice.createdAt)}</span>
                      {notice.totalViewCount && <span>조회 {notice.totalViewCount}</span>}
                    </div>
                  </div>

                  {hoveredNoticeId === notice.contentId && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNotice(notice);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="수정"
                      >
                        <Edit className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotices(notice);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="삭제"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStats(notice);
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
                        value={notice.isPublic === true ? 'true' : 'false'}
                        onChange={(e) => handlePrivacyChange(e, notice)}
                        onClick={(e) => e.stopPropagation()}
                        title="공개/비공개 설정"
                      >
                        <option value="true">공개</option>
                        <option value="false">비공개</option>
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
