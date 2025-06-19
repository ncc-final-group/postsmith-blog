'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function SkinEditPage() {
  const searchParams = useSearchParams();
  const blogId = searchParams?.get('blogId') || '1';

  useEffect(() => {
    // 새로운 스킨 편집 페이지로 리디렉션
    window.location.href = `/skin-editor?blogId=${blogId}`;
  }, [blogId]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">스킨 편집 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
