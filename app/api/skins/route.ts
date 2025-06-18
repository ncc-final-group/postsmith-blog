import { NextRequest, NextResponse } from 'next/server';

import { API_BASE_URL } from '../../../lib/constants';

export async function GET(request: NextRequest) {
  try {
    // Spring API에서 테마 목록 가져오기 (실제 API 엔드포인트 사용)
    const response = await fetch(`${API_BASE_URL}/api/manage/themes/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const themes = await response.json();

    // Spring API의 ThemesDto를 프론트엔드의 Skin 형식으로 변환
    const skins = themes.map((theme: any) => ({
      id: theme.id.toString(),
      name: theme.name,
      thumbnail: theme.thumbnailImage || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: theme.description || '',
      themeHtml: theme.themeHtml,
      themeCss: theme.themeCss,
    }));

    return NextResponse.json(skins);
  } catch (error) {
    // 오류 발생 시 기본 스킨 목록 반환
    const defaultSkins = [
      { id: 'odyssey', name: 'Odyssey', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
      { id: 'poster', name: 'Poster', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
      { id: 'whatever', name: 'Whatever', thumbnail: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
      { id: 'letter', name: 'Letter', thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b' },
      { id: 'portfolio', name: 'Portfolio', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99' },
      { id: 'bookclub', name: 'Book Club', thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2' },
      { id: 'magazine', name: 'Magazine', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
      { id: 'square', name: 'Square', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99' },
    ];

    return NextResponse.json(defaultSkins);
  }
}
