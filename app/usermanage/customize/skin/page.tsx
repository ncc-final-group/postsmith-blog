import SkinList, { Skin } from '@components/SkinList';
import { API_BASE_URL } from '../../../../lib/constants';
import { getBlogByAddress } from '../../../api/tbBlogs';

// 서버 컴포넌트용 테마 데이터 가져오기 함수
async function getSkinsServer(): Promise<Skin[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/manage/themes/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Spring API 요청 실패: ${response.status}`);
    }

    const themes = await response.json();
    
    // Spring API의 ThemesDto를 프론트엔드의 Skin 형식으로 변환
    const skins = themes.map((theme: any) => ({
      id: theme.id.toString(),
      name: theme.name,
      thumbnail: theme.thumbnailImage || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: theme.description || '',
      themeHtml: theme.themeHtml,
      themeCss: theme.themeCss
    }));

    return skins;
  } catch (error) {
    console.error('테마 데이터 가져오기 오류:', error);
    
    // 오류 발생 시 기본 스킨 목록 반환
    return [
      { id: '1', name: 'Odyssey', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca', description: '기본 테마' },
      { id: '2', name: 'Poster', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', description: '포스터 스타일' },
      { id: '3', name: 'Whatever', thumbnail: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308', description: '자유로운 스타일' },
      { id: '4', name: 'Letter', thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b', description: '편지 스타일' },
      { id: '5', name: 'Portfolio', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99', description: '포트폴리오 스타일' },
      { id: '6', name: 'Book Club', thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2', description: '북클럽 스타일' },
      { id: '7', name: 'Magazine', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca', description: '매거진 스타일' },
      { id: '8', name: 'Square', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99', description: '스퀘어 스타일' },
    ];
  }
}

// 서버 컴포넌트용 활성 스킨 데이터 가져오기 함수
async function getActiveSkinServer(blogId: number = 1): Promise<Skin> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/manage/themes/my-themes/${blogId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Spring API 요청 실패: ${response.status}`);
    }

    const activeTheme = await response.json();
    
    // Spring API의 ThemesDto를 프론트엔드의 Skin 형식으로 변환
    return {
      id: activeTheme.id.toString(),
      name: activeTheme.name,
      thumbnail: activeTheme.thumbnailImage || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: activeTheme.description || '',
      themeHtml: activeTheme.themeHtml,
      themeCss: activeTheme.themeCss,
      isActive: true
    };
  } catch (error) {
    console.error('활성 테마 가져오기 오류:', error);
    
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

// 블로그 주소 추출 함수
async function getBlogAddress(): Promise<string> {
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';

    // address.localhost:3000 형태에서 address 추출
    if (host.includes('.localhost')) {
      const subdomain = host.split('.localhost')[0];
      return subdomain;
    }

    // address.domain.com 형태에서 address 추출
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        return parts[0];
      }
    }

    // 기본값 (개발 환경)
    return 'testblog';
  } catch (error) {
    // 서버 환경에서 headers를 읽을 수 없는 경우 기본값 반환
    return 'testblog';
  }
}

export default async function SkinPage() {
  try {
    // 현재 블로그 주소에서 블로그 ID 가져오기
    const subdomain = await getBlogAddress();
    const blog = await getBlogByAddress(subdomain);
    
    if (!blog) {
      throw new Error('블로그를 찾을 수 없습니다.');
    }

    const blogId = blog.id;

    // Spring API에서 스킨 데이터 가져오기
    const [skins, activeSkin] = await Promise.all([
      getSkinsServer(),
      getActiveSkinServer(blogId)
    ]);

    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <SkinList skins={skins} activeSkinId={activeSkin.id} blogId={blogId} />
        </div>
      </main>
    );
  } catch (error) {
    console.error('스킨 페이지 로드 오류:', error);
    
    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-red-600 mb-4">스킨 데이터를 불러오는 중 오류가 발생했습니다.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
