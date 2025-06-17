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
        <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    );
  }

  // 간단한 userId 입력 로그인 (개발용)
  const handleSimpleLogin = () => {
    const userIdInput = prompt('로그인할 사용자 ID를 입력하세요:');
    
    if (userIdInput === null) {
      return;
    }
    
    const userId = parseInt(userIdInput.trim());
    
    if (isNaN(userId) || userId <= 0) {
      alert('올바른 사용자 ID를 입력해주세요 (양의 정수)');
      return;
    }
    
    // 입력받은 userId로 로그인 처리
    const { setUserInfo } = useUserStore.getState();
    setUserInfo({
      id: userId,
      email: `user${userId}@example.com`,
      nickname: `사용자${userId}`,
      profile_image: null,
    });
    
    setIsOpen(false);
    alert(`사용자 ID ${userId}로 로그인되었습니다!`);
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

  const handleLogout = () => {
    logout();
    setIsOpen(false); // 드롭다운 닫기
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={dropdownRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isMounted && authenticated && user ? (
          <span className="text-white font-bold text-lg">
            {user.nickname ? user.nickname.charAt(0).toUpperCase() : 'U'}
          </span>
        ) : (
          <svg
            className="w-6 h-6 text-white mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )}
      </button>

      {/* 드롭다운 말풍선 */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="absolute -top-2 right-3 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
          
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">운영중인 블로그</h4>
                {blogsLoading ? (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500">로딩 중...</div>
                  </div>
                ) : blogs.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {blogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => window.location.href = `/${blog.address}`}
                      >
                        <div className="flex items-center space-x-2">
                          {blog.logo_image ? (
                            <img
                              src={blog.logo_image}
                              alt={blog.nickname}
                              className="w-6 h-6 rounded object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {blog.nickname.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {blog.nickname}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              /{blog.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 text-center">
                      운영중인 블로그가 없습니다
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 mt-4">
                <button
                  onClick={() => window.location.href = '/usermanage'}
                  className="w-full px-6 text-left text-sm hover:bg-gray-50 rounded-lg transition-colors"
                  style={{ paddingTop: '16px', paddingBottom: '16px' }}
                >
                  <span className="text-gray-700">🏠 관리 페이지</span>
                </button>
                <hr className="my-4 border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="w-full px-6 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  style={{ paddingTop: '16px', paddingBottom: '16px' }}
                >
                  🚪 로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-10">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium h-10"

                >
                  🏠 PostSmith 홈페이지
                </button>
                <button
                  onClick={handleLogin}
                  className="w-full px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium h-10"
                >
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