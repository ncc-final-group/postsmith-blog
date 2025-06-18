import { Skin } from '../components/SkinList';

// 테마(스킨) 목록 조회
export async function getSkins(): Promise<Skin[]> {
  try {
    const response = await fetch('/api/skins', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 캐시 방지로 최신 데이터 가져오기
    });

    if (!response.ok) {
      throw new Error(`테마 목록 조회 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('스킨 데이터 가져오기 오류:', error);
    
    // 오류 발생 시 기본 스킨 목록 반환
    return [
      { id: 'odyssey', name: 'Odyssey', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
      { id: 'poster', name: 'Poster', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
      { id: 'whatever', name: 'Whatever', thumbnail: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
      { id: 'letter', name: 'Letter', thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b' },
      { id: 'portfolio', name: 'Portfolio', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99' },
      { id: 'bookclub', name: 'Book Club', thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2' },
      { id: 'magazine', name: 'Magazine', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
      { id: 'square', name: 'Square', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99' },
    ];
  }
}

// 활성화된 스킨 정보 조회
export async function getActiveSkin(blogId: number = 1): Promise<Skin> {
  try {
    const response = await fetch(`/api/skins/active?blogId=${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 캐시 방지로 최신 데이터 가져오기
    });

    if (!response.ok) {
      throw new Error(`활성 스킨 조회 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('활성 스킨 가져오기 오류:', error);
    
    // 오류 발생 시 기본 활성 스킨 반환
    return {
      id: '1',
      name: 'Odyssey',
      thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: '기본 테마',
      isActive: true
    };
  }
}

// 활성화된 스킨 ID 조회 (이전 버전과의 호환성)
export async function getActiveSkinId(blogId: number = 1): Promise<string> {
  try {
    const activeSkin = await getActiveSkin(blogId);
    return activeSkin.id;
  } catch (error) {
    console.error('활성 스킨 ID 가져오기 오류:', error);
    return '1';
  }
}

// 블로그의 테마 업데이트
export async function updateBlogTheme(blogId: number, themeId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch('/api/blog/update-theme', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blogId,
        themeId
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || '테마 업데이트 실패');
    }

    return {
      success: true,
      message: result.message
    };
  } catch (error) {
    console.error('테마 업데이트 오류:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '테마 업데이트 중 오류가 발생했습니다.'
    };
  }
} 