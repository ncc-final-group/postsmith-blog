'use client';

import { useCallback, useEffect, useState } from 'react';

import { useBlogStore } from '../../store/blogStore';
import { IUserSession, useSessionStore } from '../../store/sessionStore';
import { useUserStore } from '../../store/userStore';

interface SessionDebugInfo {
  serverSession: IUserSession | null;
  clientSessionStore: IUserSession | null;
  clientUserStore: any;
  clientBlogStore: any;
  timestamp: string;
}

function SyncStatus({ server, client }: { server?: string; client?: string }) {
  const isSync = server === client;
  return (
    <span className={`rounded px-2 py-1 text-xs ${
      isSync ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {isSync ? '동기화됨' : '불일치'}
    </span>
  );
}

function LocalStorageInfo() {
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionStorage = localStorage.getItem('session-storage');
      const userStorage = localStorage.getItem('user-storage');
      
      setLocalStorageData({
        sessionStorage: sessionStorage ? JSON.parse(sessionStorage) : null,
        userStorage: userStorage ? JSON.parse(userStorage) : null,
      });
    }
  }, []);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">localStorage 정보</h2>
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-medium text-gray-700">session-storage</h3>
          <div className="rounded bg-gray-50 p-4">
            <pre className="text-sm text-gray-700">
              {localStorageData?.sessionStorage ? 
                JSON.stringify(localStorageData.sessionStorage, null, 2) : 
                '데이터 없음'
              }
            </pre>
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-gray-700">user-storage</h3>
          <div className="rounded bg-gray-50 p-4">
            <pre className="text-sm text-gray-700">
              {localStorageData?.userStorage ? 
                JSON.stringify(localStorageData.userStorage, null, 2) : 
                '데이터 없음'
              }
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionDebugPage() {
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { sessionData } = useSessionStore();
  const { userInfo, isAuthenticated } = useUserStore();
  const blogStore = useBlogStore();

  const fetchServerSession = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/session');
      
      let serverSession = null;
      if (response.ok) {
        const data = await response.json();
        serverSession = data;
      }

      setDebugInfo({
        serverSession,
        clientSessionStore: sessionData,
        clientUserStore: {
          userInfo,
          isAuthenticated,
        },
        clientBlogStore: blogStore,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [sessionData, userInfo, isAuthenticated, blogStore]);

  useEffect(() => {
    fetchServerSession();
  }, [fetchServerSession]);

  const handleRefresh = () => {
    fetchServerSession();
  };

  const handleClearSession = () => {
    const { clearSession } = useSessionStore.getState();
    const { clearUser } = useUserStore.getState();
    const { clearBlog } = useBlogStore.getState();
    
    clearSession();
    clearUser();
    clearBlog();
    
    setTimeout(() => {
      fetchServerSession();
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="ml-2">세션 정보를 불러오는 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Redis 세션 디버그</h1>
          <div className="space-x-2">
            <button
              onClick={handleRefresh}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              새로고침
            </button>
            <button
              onClick={handleClearSession}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              세션 초기화
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <h3 className="font-semibold text-red-800">오류</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="space-y-6">
            {/* 타임스탬프 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">조회 시간</h2>
              <p className="font-mono text-sm text-gray-600">{debugInfo.timestamp}</p>
            </div>

            {/* 서버 세션 정보 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                서버 세션 (Redis)
                <span className={`ml-2 rounded px-2 py-1 text-xs ${
                  debugInfo.serverSession ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.serverSession ? '연결됨' : '연결 안됨'}
                </span>
              </h2>
              <div className="rounded bg-gray-50 p-4">
                <pre className="text-sm text-gray-700">
                  {debugInfo.serverSession ? JSON.stringify(debugInfo.serverSession, null, 2) : '세션 정보 없음'}
                </pre>
              </div>
            </div>

            {/* 클라이언트 세션 스토어 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                클라이언트 세션 스토어
                <span className={`ml-2 rounded px-2 py-1 text-xs ${
                  debugInfo.clientSessionStore ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.clientSessionStore ? '데이터 있음' : '데이터 없음'}
                </span>
              </h2>
              <div className="rounded bg-gray-50 p-4">
                <pre className="text-sm text-gray-700">
                  {debugInfo.clientSessionStore ? JSON.stringify(debugInfo.clientSessionStore, null, 2) : '세션 데이터 없음'}
                </pre>
              </div>
            </div>

            {/* 클라이언트 사용자 스토어 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                클라이언트 사용자 스토어
                <span className={`ml-2 rounded px-2 py-1 text-xs ${
                  debugInfo.clientUserStore.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.clientUserStore.isAuthenticated ? '인증됨' : '인증 안됨'}
                </span>
              </h2>
              <div className="rounded bg-gray-50 p-4">
                <pre className="text-sm text-gray-700">
                  {JSON.stringify(debugInfo.clientUserStore, null, 2)}
                </pre>
              </div>
            </div>

            {/* 클라이언트 블로그 스토어 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                클라이언트 블로그 스토어
                <span className={`ml-2 rounded px-2 py-1 text-xs ${
                  debugInfo.clientBlogStore.blogId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.clientBlogStore.blogId ? '블로그 로드됨' : '블로그 미로드'}
                </span>
                {debugInfo.clientBlogStore.currentTheme && (
                  <span className="ml-2 rounded px-2 py-1 text-xs bg-blue-100 text-blue-800">
                    테마: {debugInfo.clientBlogStore.currentTheme.themeName}
                  </span>
                )}
              </h2>
              
              {/* 블로그 기본 정보 */}
              <div className="mb-4">
                <h3 className="mb-2 font-medium text-gray-700">블로그 정보</h3>
                <div className="rounded bg-gray-50 p-3">
                  <pre className="text-sm text-gray-700">
                    {JSON.stringify({
                      blogId: debugInfo.clientBlogStore.blogId,
                      blogInfo: debugInfo.clientBlogStore.blogInfo,
                      isLoading: debugInfo.clientBlogStore.isLoading,
                      error: debugInfo.clientBlogStore.error,
                    }, null, 2)}
                  </pre>
                </div>
              </div>

              {/* 현재 테마 정보 */}
              {debugInfo.clientBlogStore.currentTheme && (
                <div className="mb-4">
                  <h3 className="mb-2 font-medium text-gray-700">현재 테마</h3>
                  <div className="rounded bg-gray-50 p-3">
                    <pre className="text-sm text-gray-700">
                      {JSON.stringify(debugInfo.clientBlogStore.currentTheme, null, 2)}
                    </pre>
                  </div>
                </div>
              )}


            </div>

            {/* 동기화 상태 비교 */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">동기화 상태</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded bg-gray-50 p-3">
                  <span className="font-medium">서버 ↔ 세션 스토어</span>
                  <SyncStatus 
                    server={debugInfo.serverSession?.userId} 
                    client={debugInfo.clientSessionStore?.userId} 
                  />
                </div>
                <div className="flex items-center justify-between rounded bg-gray-50 p-3">
                  <span className="font-medium">세션 스토어 ↔ 사용자 스토어</span>
                  <SyncStatus 
                    server={debugInfo.clientSessionStore?.userId} 
                    client={debugInfo.clientUserStore.userInfo?.id?.toString()} 
                  />
                </div>
                <div className="flex items-center justify-between rounded bg-gray-50 p-3">
                  <span className="font-medium">블로그 스토어 상태</span>
                  <span className={`rounded px-2 py-1 text-xs ${
                    debugInfo.clientBlogStore.blogId && debugInfo.clientBlogStore.blogInfo && debugInfo.clientBlogStore.currentTheme
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {debugInfo.clientBlogStore.blogId && debugInfo.clientBlogStore.blogInfo && debugInfo.clientBlogStore.currentTheme
                      ? '완전히 로드됨' 
                      : '부분적 로드'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* localStorage 정보 */}
            <LocalStorageInfo />
          </div>
        )}
      </div>
    </div>
  );
} 