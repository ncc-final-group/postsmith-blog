'use client';

import clsx from 'clsx';
import { BarChart2, ChevronLeft, ChevronRight, Edit, Lock, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

// Types
interface Page {
  contentId: number;
  userNickname: string;
  contentType: string;
  title: string;
  isPublic: boolean;
  likes: number;
  sequence: number;
  createdAt: string;
  categoryid?: string;
  categoryName?: string;
  categoryPath?: string;
  totalViewCount: number;
  totalRepliesCount: number;
  address: string;
}

interface BoardData {
  pages: Page[];
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
  const [address, setAddress] = useState<string | null>(null);

  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredPageId, setHoveredPageId] = useState<number | null>(null);
  const [boardData, setBoardData] = useState<BoardData>({
    pages: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
  });

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(boardData.pages.map((page) => page.categoryName).filter(Boolean)));
  }, [boardData.pages]);

  const filteredAndSortedPages = useMemo(() => {
    let pages = [...boardData.pages];

    // 🔍 제목 검색
    if (searchTerm.trim() !== '') {
      pages = pages.filter((page) => page.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 공개/비공개 필터
    if (filterPrivacy !== 'all') {
      pages = pages.filter((page) => String(page.isPublic) === filterPrivacy);
    }
    if (selectedCategory !== 'all') {
      pages = pages.filter((page) => page.categoryName === selectedCategory);
    }

    // 정렬
    pages.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === 'latest') return dateB - dateA;
      if (sortOrder === 'oldest') return dateA - dateB;
      return 0;
    });

    return pages;
  }, [boardData.pages, sortOrder, filterPrivacy, selectedCategory, searchTerm]);

  const PAGES_PER_PAGE = 5;

  function fetchPages(blogId: number, page = 1) {
    setIsLoading(true);

    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/PAGE?blogId=${blogId}`)
      .then((res) => {
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        return res.json();
      })
      .then((data: Page[]) => {
        const totalCount = data.length;
        const totalPages = Math.ceil(totalCount / PAGES_PER_PAGE);
        const paginatedPosts = data.slice((page - 1) * PAGES_PER_PAGE, page * PAGES_PER_PAGE);

        setBoardData({
          pages: paginatedPosts,
          totalCount,
          currentPage: page,
          totalPages,
        });
      })
      .catch((err) => {
        //eslint-disable-next-line no-console
        console.error('게시글을 불러오는 중 오류 발생:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    const hostname = window.location.hostname;
    let subdomain: string | null = null;

    if (hostname.includes('.postsmith.kro.kr')) {
      subdomain = hostname.split('.postsmith.kro.kr')[0];
    } else if (hostname.includes('.')) {
      subdomain = hostname.split('.')[0];
    }

    if (!subdomain) {
      //eslint-disable-next-line no-console
      console.error('유효한 서브도메인을 찾을 수 없습니다:', hostname);
      throw new Error('서브도메인을 찾을 수 없습니다.');
    }

    setAddress(subdomain);

    // 주소를 기반으로 blogId 요청
    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/blogid?address=${subdomain}`)
      .then((res) => {
        if (!res.ok) throw new Error('블로그 ID를 불러오는 데 실패했습니다.');
        return res.json();
      })

      .then((data: { blogId: number }) => {
        if (!data.blogId) throw new Error('유효한 블로그 ID를 받지 못했습니다.');
        fetchPages(data.blogId);
      })
      .catch((err) => {
        //eslint-disable-next-line no-console
        console.error(err);
        alert('블로그 정보를 불러오는 데 실패했습니다.');
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

  function handleCreatePage() {
    router.push('/edit/page');
  }

  function handlePageClick(page: Page) {
    router.push(`/pages/${page.title}`);
  }

  function handleSelectOne(pageId: number) {
    setSelectedPages((prev) => {
      const newSelectedPages = new Set(prev);
      if (newSelectedPages.has(pageId)) {
        newSelectedPages.delete(pageId);
      } else {
        newSelectedPages.add(pageId);
      }
      return newSelectedPages;
    });
  }

  function handleSelectAll() {
    const allSelected = selectedPages.size === boardData.pages.length;
    if (allSelected) {
      setSelectedPages(new Set());
    } else {
      const allIds = boardData.pages.map((pages) => pages.contentId);
      setSelectedPages(new Set(allIds));
    }
  }

  function handleEditPage(page: Page) {
    alert(`수정: ${page.title}`);
  }

  function handleViewStats(page: Page) {
    router.push(`/visits/${page.contentId}`);
  }

  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > boardData.totalPages) return;

    const start = (pageNum - 1) * PAGES_PER_PAGE;
    const end = pageNum * PAGES_PER_PAGE;
    const blogId = 2;
    fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/PAGE?blogId=${blogId}`)
      .then((res) => res.json())
      .then((data: Page[]) => {
        const filteredPages = data.filter((page) => page.contentType === 'PAGE');
        const paginatedPages = filteredPages.slice(start, end);

        setBoardData((prev) => ({
          ...prev,
          pages: paginatedPages,
          currentPage: pageNum,
        }));
      });
  };

  async function handlePrivacyChange(e: React.ChangeEvent<HTMLSelectElement>, page: Page) {
    const newPrivacy = e.target.value === 'true';

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/${page.contentId}/privacy?isPublic=${newPrivacy}`, { method: 'PATCH' });

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      setBoardData((prev) => ({
        ...prev,
        pages: prev.pages.map((p) => (p.contentId === page.contentId ? { ...p, isPublic: newPrivacy } : p)),
      }));
    } catch (error) {
      // console.error('공개 여부 변경 실패:', error);
      alert('공개 여부 변경에 실패했습니다.');
    }
  }

  async function handleDeletePage(page: Page) {
    const confirmed = confirm(`정말 삭제하시겠습니까? (${page.title})`);
    if (!confirmed) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/Posts/delete/${page.contentId}`, { method: 'DELETE' });

      if (!res.ok) {
        throw new Error(`서버 응답 오류: ${res.status}`);
      }

      // 프론트 상태 동기화
      setBoardData((prev) => ({
        ...prev,
        pages: prev.pages.filter((p) => p.contentId !== page.contentId),
      }));
    } catch (error) {
      // console.error('삭제 요청 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  }

  async function handleBulkAction(action: string) {
    if (selectedPages.size === 0) {
      alert('먼저 게시글을 선택하세요.');
      return;
    }

    if (action === 'delete') {
      if (!confirm('선택된 게시글을 삭제하시겠습니까?')) return;

      try {
        const idsToDelete = Array.from(selectedPages);

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
          pages: prev.pages.filter((page) => !selectedPages.has(page.contentId)),
        }));
        setSelectedPages(new Set());
      } catch (error) {
        // console.error('삭제 요청 실패:', error);
        alert('삭제에 실패했습니다.');
      }
    } else if (action === 'makePublic' || action === 'makePrivate') {
      const newPrivacy = action === 'makePublic';
      const contentIds = Array.from(selectedPages);

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
          pages: prev.pages.map((page) => (selectedPages.has(page.contentId) ? { ...page, isPublic: newPrivacy } : page)),
        }));
      } catch (error) {
        // console.error('공개/비공개 변경 실패:', error);
        alert('공개/비공개 변경에 실패했습니다.');
      }
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-none">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            페이지 관리
            <span className="ml-1 rounded-full bg-gray-100 text-sm font-normal text-gray-500">{boardData.totalCount}</span>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {filterPrivacy === 'all' ? '전체' : filterPrivacy === 'true' ? '공개' : '비공개'} /{selectedCategory === 'all' ? '전체' : selectedCategory}
            </span>
          </h1>
          <button
            onClick={handleCreatePage}
            className={clsx(
              'flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2',
              'text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-blue-500 hover:text-white',
            )}
          >
            <Edit className="h-4 w-4" />
            페이지 작성
          </button>
        </div>
      </div>

      <div className="max-w-none pt-1">
        <div className="mb-4 flex flex-col items-start gap-4 border border-gray-300 bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedPages.size === boardData.pages.length && boardData.pages.length > 0}
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
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortType)} className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800">
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
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800"
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
          ) : boardData.pages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>작성한 페이지가 없습니다.</p>
            </div>
          ) : (
            filteredAndSortedPages.map((page, index) => (
              <div
                key={page.contentId}
                className={`relative cursor-pointer border-b border-gray-200 p-4 transition-colors duration-150 hover:bg-gray-100 ${index === boardData.pages.length - 1 ? 'border-b-0' : ''}`}
                onClick={() => handlePageClick(page)}
                onMouseEnter={() => setHoveredPageId(page.contentId)}
                onMouseLeave={() => setHoveredPageId(null)}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedPages.has(page.contentId)}
                    onChange={() => handleSelectOne(page.contentId)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      {page.contentType && <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">{page.contentType}</span>}
                      <h3 className="relative truncate font-medium text-gray-900">{page.title}</h3>
                      {page.isPublic === false && hoveredPageId !== page.contentId && <Lock className="absolute top-8 right-9 h-4 w-4 text-gray-400" />}

                      {page.totalRepliesCount ? <span className="text-sm font-medium text-blue-600">[{page.totalRepliesCount}]</span> : null}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-medium text-orange-600">{page.categoryPath || 'no category'}</span>

                      <span>{page.userNickname}</span>
                      <span>{formatDate(page.createdAt)}</span>
                      {page.totalViewCount && <span>조회 {page.totalViewCount}</span>}
                    </div>
                  </div>

                  {hoveredPageId === page.contentId && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPage(page);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="수정"
                      >
                        <Edit className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page);
                        }}
                        className="rounded p-1 hover:bg-gray-200"
                        title="삭제"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStats(page);
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
                        value={page.isPublic === true ? 'true' : 'false'}
                        onChange={(e) => handlePrivacyChange(e, page)}
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
