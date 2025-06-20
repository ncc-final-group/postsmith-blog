'use client';

import { useEffect, useState } from 'react';
import { useBlogStore } from '../../../store/blogStore';
import SkinList, { Skin } from '@components/SkinList';

// Spring API의 ThemesDto 타입 정의
interface ThemesDto {
  id: number;
  name: string;
  coverImage?: string;
  image?: string;
  description?: string;
  author?: string;
  authorLink?: string;
  html?: string;
  css?: string;
}

export default function SkinPage() {
  const {
    blogId,
    blogInfo,
    currentTheme,
    isLoading,
    error,
    fetchCurrentTheme,
  } = useBlogStore();

  const [availableThemes, setAvailableThemes] = useState<Skin[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  // 사용 가능한 테마 목록 가져오기
  const fetchAvailableThemes = async (): Promise<Skin[]> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVER}/api/themes/a`);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
      }

      const themesDto: ThemesDto[] = await response.json();

      return themesDto.map((theme: ThemesDto) => ({
        id: theme.id.toString(),
        name: theme.name,
        thumbnail: theme.coverImage || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
        description: theme.description || '',
        themeHtml: theme.html,
        themeCss: theme.css,
        author: theme.author,
        authorLink: theme.authorLink,
      }));
    } catch (error) {
      throw new Error(`스킨 데이터 로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  useEffect(() => {
    const loadThemeData = async () => {
      if (!blogId) {
        setLocalError('블로그 ID가 없습니다.');
        setLocalLoading(false);
        return;
      }

      try {
        setLocalLoading(true);
        setLocalError(null);

        // 현재 테마와 사용 가능한 테마 목록을 병렬로 로드
        const [, themes] = await Promise.all([
          fetchCurrentTheme(blogId),
          fetchAvailableThemes(),
        ]);

        setAvailableThemes(themes);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다.');
      } finally {
        setLocalLoading(false);
      }
    };

    loadThemeData();
  }, [blogId, fetchCurrentTheme]);

  if (localLoading || isLoading) {
    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-2">테마 정보를 불러오는 중...</span>
          </div>
        </div>
      </main>
    );
  }

  if (localError || error) {
    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <div className="rounded bg-red-100 p-4 mb-4">
            <p className="text-red-800">오류 발생:</p>
            <p className="text-red-600">{localError || error}</p>
          </div>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="mb-4 text-red-600">스킨 데이터를 불러오는 중 오류가 발생했습니다.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!blogId) {
    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <div className="rounded bg-yellow-100 p-4">
            <p className="text-yellow-800">블로그 정보를 찾을 수 없습니다.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>

        <SkinList 
          skins={availableThemes} 
          activeSkinId={currentTheme?.themeId?.toString() || '1'} 
          blogId={blogId} 
        />
      </div>
    </main>
  );
}
