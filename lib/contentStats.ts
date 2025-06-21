// 조회수 및 방문자 수 관리 API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER || '';

// 조회수 DTO 인터페이스
export interface ContentViewsDto {
  id?: number;
  contentId: number;
  viewsCount?: number;
  createdOn?: string;
}

// 방문자 수 DTO 인터페이스
export interface ContentVisitsDto {
  id?: number;
  contentId: number;
  userId?: number;
  ipAddress: string;
  createdAt?: string;
}

// 조회수 증가 API 호출 (Spring API 사용)
export async function recordContentView(contentId: number): Promise<ContentViewsDto> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/content_stats/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId: contentId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to record content view: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// 방문자 수 증가 API 호출 (Spring API 사용)
export async function recordContentVisit(contentId: number, userId?: number, ipAddress: string = '127.0.0.1'): Promise<ContentVisitsDto> {
  try {
    const requestBody: any = { contentId: contentId, ipAddress: ipAddress };

    // userId가 있는 경우에만 추가
    if (userId) {
      requestBody.userId = userId;
    }

    const response = await fetch(`${API_BASE_URL}/api/content_stats/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to record content visit: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// 총 조회수 가져오기 API 호출 (Next.js API 사용)
export async function getTotalViewsByContentId(contentId: number): Promise<number> {
  try {
    const response = await fetch(`/api/content-stats/views/${contentId}`, {
      method: 'GET',
      cache: 'no-store', // 캐시 방지로 최신 데이터 가져오기
    });

    if (!response.ok) {
      throw new Error(`Failed to get total views: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return 0; // 오류 시 기본값 0 반환
  }
}

// 총 방문자 수 가져오기 API 호출 (Next.js API 사용)
export async function getTotalVisitsByContentId(contentId: number): Promise<number> {
  try {
    const response = await fetch(`/api/content-stats/visits/${contentId}`, {
      method: 'GET',
      cache: 'no-store', // 캐시 방지로 최신 데이터 가져오기
    });

    if (!response.ok) {
      throw new Error(`Failed to get total visits: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return 0; // 오류 시 기본값 0 반환
  }
}

// 오늘 조회수 가져오기 API 호출 (Next.js API 사용)
export async function getTodayViewsByContentId(contentId: number): Promise<number> {
  try {
    const response = await fetch(`/api/content-stats/views-today/${contentId}`, {
      method: 'GET',
      cache: 'no-store', // 캐시 방지로 최신 데이터 가져오기
    });

    if (!response.ok) {
      throw new Error(`Failed to get today views: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return 0; // 오류 시 기본값 0 반환
  }
}

// 클라이언트에서 IP 주소를 가져오는 함수
export function getClientIP(): string {
  // 브라우저 환경에서는 실제 IP를 직접 가져올 수 없으므로 기본값 사용
  // 실제 환경에서는 서버에서 처리하거나 외부 서비스 이용
  return '127.0.0.1';
}
