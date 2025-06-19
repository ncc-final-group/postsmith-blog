'use client';

import { useEffect, useState } from 'react';

export default function AuthActionButtons() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setIsLoggedIn(true);
          setUserInfo(data.user);
        }
      }
    } catch (error) {
      // 로그인 상태가 아님
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  };

  // 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    const userId = prompt('사용자 ID를 입력하세요 (숫자):');

    if (!userId) {
      return;
    }

    if (!/^\d+$/.test(userId)) {
      alert('숫자만 입력해주세요.');
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
        alert(`로그인 성공! 사용자: ${data.user.nickname}`);
        setIsLoggedIn(true);
        setUserInfo(data.user);
        window.location.reload(); // 페이지 새로고침으로 상태 반영
      } else {
        alert(`로그인 실패: ${data.error}`);
      }
    } catch (error) {
      alert('로그인 요청 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });

      const data = await response.json();

      if (data.success) {
        alert('로그아웃되었습니다.');
        setIsLoggedIn(false);
        setUserInfo(null);
        window.location.reload(); // 페이지 새로고침으로 상태 반영
      } else {
        alert('로그아웃 실패');
      }
    } catch (error) {
      alert('로그아웃 요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">사용자 인증</h2>

      {isLoggedIn && userInfo ? (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
          <p className="text-green-800">
            <strong>로그인됨:</strong> {userInfo.nickname} (ID: {userInfo.id})
          </p>
        </div>
      ) : (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-gray-600">로그인되지 않음</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {!isLoggedIn ? (
          <button className="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600" onClick={handleLogin}>
            로그인
          </button>
        ) : (
          <button className="rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600" onClick={handleLogout}>
            로그아웃
          </button>
        )}

        <button className="rounded-md bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600" onClick={() => window.location.reload()}>
          페이지 새로고침
        </button>

        <button className="rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600" onClick={() => window.history.back()}>
          이전 페이지
        </button>
      </div>
    </div>
  );
}
