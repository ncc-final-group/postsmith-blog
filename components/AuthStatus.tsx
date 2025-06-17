'use client';

import { getCurrentUser, getCurrentUserId, isUserAuthenticated, useUserStore } from '../app/store/userStore';

export default function AuthStatus() {
  const { userInfo, isLoading, error, isAuthenticated } = useUserStore();

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
  );
} 