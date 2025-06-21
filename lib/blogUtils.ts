import { headers } from 'next/headers';

// 블로그 주소 추출 함수 (공통 유틸리티)
export async function getBlogAddress(): Promise<string> {
  try {
    const headersList = await headers();

    // 먼저 middleware에서 설정한 x-subdomain 헤더 확인
    const subdomain = headersList.get('x-subdomain');
    // eslint-disable-next-line no-console
    console.log('🔍 [DEBUG] x-subdomain:', subdomain);
    if (subdomain) {
      return subdomain;
    }

    // x-subdomain 헤더가 없으면 host 헤더에서 추출
    const host = headersList.get('host') || headersList.get('authority') || headersList.get('x-forwarded-host') || headersList.get(':authority') || '';
    // eslint-disable-next-line no-console
    console.log('🔍 [DEBUG] x-subdomain 없음');
    // address.postsmith.kro.kr 형태에서 address 추출
    if (host.includes('.postsmith.kro.kr')) {
      return host.split('.postsmith.kro.kr')[0];
    }

    // address.localhost:3000 형태에서 address 추출
    // if (host.includes('.localhost')) {
    //   const subdomain = host.split('.localhost')[0];
    //   return subdomain;
    // }

    // address.domain.com 형태에서 address 추출
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length >= 2 && parts[0] !== 'localhost') {
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
