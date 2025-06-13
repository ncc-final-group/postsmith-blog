interface MediaFile {
  id: number;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'file';
  mimeType: string;
  fileSize: number;
  altText?: string;
  description?: string;
  userId: number;
  blogId?: number;
  createdAt: string;
}

interface MediaStats {
  totalCount: number;
  totalSize: number;
  typeCounts: {
    [key: string]: number;
  };
}

interface MediaListResponse {
  content: MediaFile[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// 파일명과 타입으로 MIME 타입 추정
function determineMimeType(filename: string, fileType: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (fileType === 'image') {
    switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/jpeg';
    }
  } else if (fileType === 'video') {
    switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'avi':
      return 'video/avi';
    case 'mov':
      return 'video/quicktime';
    default:
      return 'video/mp4';
    }
  } else {
    switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
    case 'docx':
      return 'application/msword';
    case 'xls':
    case 'xlsx':
      return 'application/vnd.ms-excel';
    case 'ppt':
    case 'pptx':
      return 'application/vnd.ms-powerpoint';
    case 'zip':
      return 'application/zip';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
    }
  }
}

// 미디어 파일 목록 조회
export async function getMediaFiles(params: { userId: number; page?: number; size?: number; fileType?: string; search?: string }): Promise<MediaListResponse> {
  const searchParams = new URLSearchParams({
    userId: params.userId.toString(),
    page: (params.page || 0).toString(),
    size: (params.size || 20).toString(),
  });

  if (params.fileType) {
    searchParams.append('fileType', params.fileType);
  }

  if (params.search) {
    searchParams.append('search', params.search);
  }

  const response = await fetch(`${API_BASE_URL}/api1/media?${searchParams}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('미디어 파일 목록 조회에 실패했습니다.');
  }

  const data = await response.json();

  // 디버깅용 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development' && data.content && data.content.length > 0) {
    // eslint-disable-next-line no-console
    console.log('🔍 [API Debug] 원본 Spring API 응답:', data.content[0]);
  }

  // Spring API 응답을 프론트엔드 형식으로 변환
  const transformedData = {
    ...data,
    content: data.content.map((item: any) => {
      const transformed = {
        id: item.id,
        fileName: item.filename,
        originalFileName: item.filename,
        fileUrl: item.uri,
        fileType: item.fileType,
        mimeType: determineMimeType(item.filename, item.fileType),
        fileSize: item.fileSize,
        altText: item.altText || '',
        description: item.description || '',
        userId: 1, // 고정값
        blogId: item.blogId,
        createdAt: item.createdAt,
      };

      // 첫 번째 항목의 변환 결과 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development' && item === data.content[0]) {
        // eslint-disable-next-line no-console
        console.log('🔄 [API Debug] 변환된 데이터:', transformed);
        // eslint-disable-next-line no-console
        console.log('📷 [API Debug] 이미지 URL:', transformed.fileUrl);
      }

      return transformed;
    }),
  };

  return transformedData;
}

// 미디어 파일 상세 조회
export async function getMediaFile(id: number, userId: number = 1): Promise<MediaFile> {
  const response = await fetch(`${API_BASE_URL}/api1/media/${id}?userId=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('미디어 파일 조회에 실패했습니다.');
  }

  const data = await response.json();

  // Spring API 응답을 프론트엔드 형식으로 변환
  return {
    id: data.id,
    fileName: data.filename,
    originalFileName: data.filename,
    fileUrl: data.uri,
    fileType: data.fileType,
    mimeType: determineMimeType(data.filename, data.fileType),
    fileSize: data.fileSize,
    altText: data.altText || '',
    description: data.description || '',
    userId: 1, // 고정값
    blogId: data.blogId,
    createdAt: data.createdAt,
  };
}

// 미디어 파일 정보 수정
export async function updateMediaFile(
  id: number,
  updateData: {
    altText?: string;
    description?: string;
    blogId?: number;
  },
  userId: number = 1,
): Promise<MediaFile> {
  const response = await fetch(`${API_BASE_URL}/api1/media/${id}?userId=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error('미디어 파일 수정에 실패했습니다.');
  }

  return response.json();
}

// 미디어 파일 삭제
export async function deleteMediaFile(id: number, userId: number = 1): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api1/media/${id}?userId=${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('미디어 파일 삭제에 실패했습니다.');
  }
}

// 여러 미디어 파일 삭제
export async function deleteMediaFiles(ids: number[], userId: number = 1): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api1/media/batch?userId=${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ids),
  });

  if (!response.ok) {
    throw new Error('미디어 파일 삭제에 실패했습니다.');
  }
}

// 미디어 통계 조회
export async function getMediaStats(userId: number): Promise<MediaStats> {
  const response = await fetch(`${API_BASE_URL}/api1/media/stats?userId=${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('미디어 통계 조회에 실패했습니다.');
  }

  return response.json();
}

// 파일 크기를 읽기 쉬운 형태로 변환
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 파일 타입 아이콘 가져오기
export function getFileTypeIcon(fileType: string, mimeType: string): string {
  // 이미지 타입
  if (fileType === 'image') {
    if (mimeType.includes('gif')) return '🎬';
    if (mimeType.includes('svg')) return '🎨';
    return '🖼️';
  }

  // 비디오 타입
  if (fileType === 'video') {
    if (mimeType.includes('mp4')) return '🎞️';
    if (mimeType.includes('webm')) return '🎥';
    if (mimeType.includes('avi')) return '📹';
    if (mimeType.includes('mov')) return '🎬';
    return '🎥';
  }

  // 문서 파일
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('docx')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';

  // 압축 파일
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';

  // 코드 파일
  if (mimeType.includes('javascript') || mimeType.includes('typescript')) return '⚡';
  if (mimeType.includes('html') || mimeType.includes('css')) return '🌐';
  if (mimeType.includes('json') || mimeType.includes('xml')) return '🔧';
  if (mimeType.includes('python')) return '🐍';
  if (mimeType.includes('java')) return '☕';

  // 텍스트 파일
  if (mimeType.includes('text')) return '📝';

  // 오디오 파일
  if (mimeType.includes('audio')) return '🎵';

  // 기본 파일 아이콘
  return '📄';
}

// 파일 타입별 배경색 가져오기
export function getFileTypeColor(fileType: string, mimeType: string): string {
  if (fileType === 'image') return 'bg-blue-100 text-blue-600';
  if (fileType === 'video') return 'bg-purple-100 text-purple-600';

  if (mimeType.includes('pdf')) return 'bg-red-100 text-red-600';
  if (mimeType.includes('word') || mimeType.includes('docx')) return 'bg-blue-100 text-blue-600';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'bg-green-100 text-green-600';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'bg-orange-100 text-orange-600';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'bg-yellow-100 text-yellow-600';
  if (mimeType.includes('audio')) return 'bg-pink-100 text-pink-600';

  return 'bg-gray-100 text-gray-600';
}

export type { MediaFile, MediaStats, MediaListResponse };
