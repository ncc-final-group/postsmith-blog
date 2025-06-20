export function getSubdomain(hostname?: string): string {
  if (typeof window === 'undefined' && !hostname) return '';

  const host = hostname || window.location.hostname;

  if (host.includes('.localhost')) {
    return host.split('.localhost')[0];
  }

  const parts = host.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  return '';
}

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 환경에 따른 base URL 반환
 * - 서버 사이드: 환경변수 사용
 * - 클라이언트 사이드: 현재 origin 사용
 */
export function getBaseUrl(): string {
  // 서버 사이드에서는 환경변수 사용
  if (typeof window === 'undefined') {
    // Vercel 배포시 자동으로 설정되는 환경변수들 활용
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // 기타 배포 환경을 위한 환경변수
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    // 로컬 개발환경 - 포트 3001 사용
    return 'http://localhost:3001';
  }

  // 클라이언트 사이드에서는 현재 origin 사용
  return window.location.origin;
}
