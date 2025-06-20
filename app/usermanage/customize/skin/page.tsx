import { assert } from 'console';

import { API_BASE_URL } from '../../../../lib/constants';
import { getBaseUrl } from '../../../../lib/utils';
import { getBlogByAddress } from '../../../api/tbBlogs';

import SkinList, { Skin } from '@components/SkinList';

// 서버 컴포넌트용 테마 데이터 가져오기 함수
async function getSkinsServer(): Promise<Skin[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/themes/a`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      assert(false, 'Failed to fetch themes');
    }

    const themeTagsDtoList = await response.json();

    // Spring API의 ThemeTagsDto를 프론트엔드의 Skin 형식으로 변환
    const skins = themeTagsDtoList.map((item: any) => ({
      id: item.theme.id.toString(),
      name: item.theme.name,
      thumbnail: item.theme.coverImage || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: item.theme.description || '',
      themeHtml: item.theme.html,
      themeCss: item.theme.css,
      author: item.theme.author,
      authorLink: item.theme.authorLink,
    }));

    return skins;
  } catch (error) {
    // 오류 발생 시 기본 스킨 목록 반환
    return [
      { id: '11', name: 'PostSmith', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca', description: '기본 테마' },
      { id: '13', name: '쇼핑몰 전용 테마', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb', description: '쇼핑몰에 적합한 기능이 포함된 테마입니다.' },
      {
        id: '14',
        name: '비즈니스 사이트 테마',
        thumbnail: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
        description: '기업 사이트에 적합한 깔끔한 디자인입니다.',
      },
      { id: '16', name: '온라인 매거진 테마', thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b', description: '온라인 잡지 및 뉴스에 적합한 테마입니다.' },
      { id: '19', name: '블로그 포트폴리오 테마', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99', description: '포트폴리오에 최적화된 블로그형 테마.' },
      { id: '20', name: '쇼핑몰 심플 테마', thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2', description: '쇼핑몰에 필요한 기본 기능 중심의 테마.' },
    ];
  }
}

// 서버 컴포넌트용 활성 스킨 데이터 가져오기 함수
async function getActiveSkinServer(blogId: number = 1): Promise<Skin> {
  try {
    // 서버 사이드에서는 내부 API 호출을 위해 localhost:3001 사용
    const baseUrl = typeof window === 'undefined' ? 'http://localhost:3001' : window.location.origin;
    // 새로운 blog-themes API 사용
    const response = await fetch(`${baseUrl}/api/manage/blog-themes/${blogId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      assert(false, 'Failed to fetch blog theme');
    }

    const blogTheme = await response.json();

    // BlogThemesDto를 프론트엔드의 Skin 형식으로 변환
    return {
      id: blogTheme.themeId?.toString() || '1',
      name: blogTheme.themeName || 'Unknown Theme',
      thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca', // 기본 썸네일
      description: '',
      themeHtml: blogTheme.themeHtml,
      themeCss: blogTheme.themeCss,
      isActive: blogTheme.isActive || true,
    };
  } catch (error) {
    // 오류 발생 시 기본 활성 스킨 반환
    return {
      id: '1',
      name: 'Odyssey',
      thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      description: '기본 테마',
      isActive: true,
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

    const blogId = blog?.id;

    // Spring API에서 스킨 데이터 가져오기
    const [skins, activeSkin] = await Promise.all([getSkinsServer(), getActiveSkinServer(blogId)]);

    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <SkinList skins={skins} activeSkinId={activeSkin.id} blogId={blogId} />
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="mb-4 text-red-600">스킨 데이터를 불러오는 중 오류가 발생했습니다.</p>
              <button onClick={() => window.location.reload()} className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
