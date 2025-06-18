'use client';

import { getCurrentUser, getCurrentUserId, isUserAuthenticated, useUserStore } from '../app/store/userStore';
import { useBlogStore } from '../app/store/blogStore';

export default function AuthStatus() {
  const { userInfo, isLoading, error, isAuthenticated } = useUserStore();
  const { blogInfo, blogId, error: blogError } = useBlogStore();

  // 편의 함수들 사용 예시
  const userId = getCurrentUserId();
  const user = getCurrentUser();
  const authenticated = isUserAuthenticated();

  if (isLoading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">오류: {error}</div>;
  }

  if (!isAuthenticated || !userInfo) {
    return <div className="text-gray-500">로그인되지 않음</div>;
  }

  return (
    <div className="space-y-4">
      {/* 사용자 정보 */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">사용자 정보</h3>
        <div className="space-y-1 text-sm">
          <p><strong>ID:</strong> {userInfo.id}</p>
          <p><strong>닉네임:</strong> {userInfo.nickname}</p>
          <p><strong>이메일:</strong> {userInfo.email}</p>
          <p><strong>인증 상태:</strong> {authenticated ? '로그인됨' : '로그아웃됨'}</p>
        </div>
        
        <div className="mt-4 text-xs text-gray-600">
          <p>편의 함수 사용:</p>
          <p>getCurrentUserId(): {userId}</p>
          <p>getCurrentUser()?.nickname: {user?.nickname}</p>
          <p>isUserAuthenticated(): {authenticated.toString()}</p>
        </div>
      </div>

      {/* 블로그 정보 */}
      <div className="rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">블로그 정보</h3>
        {blogError && (
          <div className="mb-2 text-red-500 text-sm">
            블로그 오류: {blogError}
          </div>
        )}
        {blogInfo ? (
          <div className="space-y-1 text-sm">
            <p><strong>블로그 ID:</strong> {blogInfo.id}</p>
            <p><strong>블로그 닉네임:</strong> {blogInfo.nickname}</p>
            <p><strong>블로그 주소:</strong> {blogInfo.address}</p>
            <p><strong>설명:</strong> {blogInfo.description || '없음'}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">
            {blogId ? `블로그 ID: ${blogId} (정보 로딩 중...)` : '블로그가 설정되지 않음'}
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-600">
          <p>현재 URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          <p>호스트: {typeof window !== 'undefined' ? window.location.host : 'SSR'}</p>
        </div>
      </div>

      {/* 문제 해결 안내 */}
      {authenticated && !blogInfo && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <h4 className="mb-2 font-semibold text-yellow-800">블로그 설정 필요</h4>
          <div className="text-sm text-yellow-700">
            <p>현재 로그인은 되어 있지만 블로그가 설정되지 않았습니다.</p>
            <p>블로그를 사용하려면:</p>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>올바른 블로그 주소로 접속하거나</li>
              <li>사용자에게 블로그를 생성해야 합니다</li>
            </ol>
            <p className="mt-2 font-medium">
              예: userid 1의 블로그 주소가 "myblog"라면 <code>myblog.localhost:3000</code>으로 접속
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 