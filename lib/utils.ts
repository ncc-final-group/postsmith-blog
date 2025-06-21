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
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  // 클라이언트 사이드에서는 현재 origin 사용
  return window.location.origin;
}
