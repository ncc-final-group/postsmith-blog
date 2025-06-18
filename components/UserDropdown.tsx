'use client';

import { useEffect, useRef, useState } from 'react';

import { getCurrentUser, isUserAuthenticated, logout, useUserStore } from '../app/store/userStore';

interface Blog {
  id: number;
  user_id: number;
  address: string;
  nickname: string;
  description: string | null;
  logo_image: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userInfo, isLoading } = useUserStore();
  const user = getCurrentUser();
  const authenticated = isUserAuthenticated();

  // 클라이언트 hydration 완료 체크
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 블로그 리스트 가져오기
  const fetchUserBlogs = async () => {
    if (!user?.id) return;

    setBlogsLoading(true);
    try {
      const response = await fetch(`/api/user-blogs?userId=${user.id}`);
      if (response.ok) {
        const blogsData = await response.json();
        setBlogs(blogsData);
      }
    } catch (error) {
      // 에러 처리는 조용히
    } finally {
      setBlogsLoading(false);
    }
  };

  // 사용자가 로그인되고 드롭다운이 열릴 때 블로그 리스트 가져오기
  useEffect(() => {
    if (isOpen && authenticated && user?.id) {
      fetchUserBlogs();
    }
  }, [isOpen, authenticated, user?.id]);

  if (isLoading || !isMounted) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gray-300"></div>
      </div>
    );
  }

  // 서버 API 기반 로그인 (AuthActionButtons와 동일한 방식)
  const handleSimpleLogin = async () => {
    const userId = prompt('사용자 ID를 입력하세요 (숫자):');

    if (!userId) {
      return;
    }

    if (!/^\d+$/.test(userId)) {
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        // 클라이언트 상태도 업데이트
        const { setUserInfo } = useUserStore.getState();
        setUserInfo({
          id: data.user.id,
          email: data.user.email,
          nickname: data.user.nickname,
          profile_image: data.user.profile_image,
        });

        setIsOpen(false);
        window.location.reload(); // 페이지 새로고침으로 서버 상태 반영
      }
    } catch (error) {
      // 로그인 실패 시 조용히 처리
    }
  };

  // Redis 세션 기반 로그인 (나중에 사용)
  const handleRedisLogin = async () => {
    const sessionKey = prompt('Redis 세션 키를 입력하세요:');

    if (sessionKey === null || sessionKey.trim() === '') {
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionKey: sessionKey.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { setUserInfo } = useUserStore.getState();
        setUserInfo({
          id: data.user.id,
          email: data.user.email,
          nickname: data.user.nickname,
          profile_image: data.user.profile_image,
        });

        setIsOpen(false);
        alert(`${data.user.nickname}님으로 로그인되었습니다!`);
      } else {
        alert(data.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      alert('로그인 처리 중 오류가 발생했습니다.');
    }
  };

  // 개발용 간단 로그인 (나중에 Redis 로그인으로 전환 가능)
  const handleLogin = async () => {
    // TODO: Redis 세션 기반 로그인으로 전환할 때 주석 해제
    // return handleRedisLogin();

    return handleSimpleLogin();
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });

      const data = await response.json();

      if (data.success) {
        // 클라이언트 상태도 업데이트
        logout();
        setIsOpen(false);
        window.location.reload(); // 페이지 새로고침으로 서버 상태 반영
      }
    } catch (error) {
      // 로그아웃 실패 시 조용히 처리
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={dropdownRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full border-2 border-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
      >
        {isMounted && authenticated && user ? (
          <span className="text-lg font-bold text-white">{user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}</span>
        ) : (
          <svg className="mx-auto h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>

      {/* 드롭다운 말풍선 */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="absolute -top-2 right-3 h-4 w-4 rotate-45 transform border-t border-l border-gray-200 bg-white"></div>

          {isMounted && authenticated && user ? (
            <div className="p-6">
              <div className="mb-4">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">{user.nickname || '사용자'}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              {/* 운영중인 블로그 리스트 */}
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-medium text-gray-700">운영중인 블로그</h4>
                {blogsLoading ? (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-sm text-gray-500">로딩 중...</div>
                  </div>
                ) : blogs.length > 0 ? (
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {blogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="cursor-pointer rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100"
                        onClick={() => (window.location.href = `/${blog.address}`)}
                      >
                        <div className="flex items-center space-x-2">
                          {blog.logo_image ? (
                            <img src={blog.logo_image} alt={blog.nickname} className="h-6 w-6 rounded object-cover" />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500">
                              <span className="text-xs font-bold text-white">{blog.nickname.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{blog.nickname}</p>
                            <p className="truncate text-xs text-gray-500">/{blog.address}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-center text-sm text-gray-500">운영중인 블로그가 없습니다</p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-4">
                <button
                  onClick={() => (window.location.href = '/usermanage')}
                  className="w-full rounded-lg px-6 text-left text-sm transition-colors hover:bg-gray-50"
                  style={{ paddingTop: '16px', paddingBottom: '16px' }}
                >
                  <span className="text-gray-700">🏠 관리 페이지</span>
                </button>
                <hr className="my-4 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-6 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                  style={{ paddingTop: '16px', paddingBottom: '16px' }}
                >
                  🚪 로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-10">
                <button onClick={() => (window.location.href = '/')} className="h-10 w-full rounded-lg bg-gray-500 px-6 font-medium text-white transition-colors hover:bg-gray-600">
                  🏠 PostSmith 홈페이지
                </button>
                <button onClick={handleLogin} className="h-10 w-full rounded-lg bg-blue-500 px-6 font-medium text-white transition-colors hover:bg-blue-600">
                  🔑 로그인하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
