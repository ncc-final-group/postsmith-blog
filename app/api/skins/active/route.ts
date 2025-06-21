import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../../lib/constants';

import { useBlogStore } from '@app/store/blogStore';

export async function GET(request: NextRequest) {
  try {
    const blogId = useBlogStore.getState().blogId;

    // Spring API에서 블로그별 활성 테마 가져오기
    const response = await fetch(`${API_BASE_URL}/api/manage/themes/my-themes/${blogId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const activeTheme = await response.json();

    // Spring API의 ThemesDto를 프론트엔드의 Skin 형식으로 변환
    const activeSkin = {
      id: activeTheme.id.toString(),
      name: activeTheme.name,
      thumbnail: activeTheme.thumbnailImage || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: activeTheme.description || '',
      themeHtml: activeTheme.themeHtml,
      themeCss: activeTheme.themeCss,
      isActive: true,
    };

    return NextResponse.json(activeSkin);
  } catch (error) {
    // 오류 발생 시 기본 활성 스킨 반환
    const defaultActiveSkin = {
      id: '1',
      name: 'Odyssey',
      thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: '기본 테마',
      isActive: true,
    };

    return NextResponse.json(defaultActiveSkin);
  }
}
