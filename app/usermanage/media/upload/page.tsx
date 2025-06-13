'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
// 업로드 서비스 함수들 (임시로 여기에 정의)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface UploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  altText?: string;
  fileSize?: number;
  fileType?: string;
  message?: string;
}

const uploadImageToServer = async (file: File, altText?: string, userId?: number, blogId?: number): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }
    if (userId) {
      formData.append('userId', userId.toString());
    }
    if (blogId) {
      formData.append('blogId', blogId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api1/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('이미지 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

const uploadVideoToServer = async (file: File, altText?: string, userId?: number, blogId?: number): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('altText', altText);
    }
    if (userId) {
      formData.append('userId', userId.toString());
    }
    if (blogId) {
      formData.append('blogId', blogId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api1/upload/video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('비디오 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

const uploadFileToServer = async (file: File, displayName?: string, userId?: number, blogId?: number): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (displayName) {
      formData.append('displayName', displayName);
    }
    if (userId) {
      formData.append('userId', userId.toString());
    }
    if (blogId) {
      formData.append('blogId', blogId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api1/upload/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result: UploadResponse = await response.json();
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('파일 업로드 오류:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
};

interface UploadItem {
  id: string;
  file: File;
  type: 'image' | 'video' | 'file';
  altText?: string;
  displayName?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  result?: UploadResponse;
}

export default function MediaUploadPage() {
  const router = useRouter();
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // 임시 사용자 ID
  const userId = 1;

  const getFileType = (file: File): 'image' | 'video' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file: File) => {
      const fileType = getFileType(file);
      let maxSize: number;
      let sizeName: string;

      // 파일 타입별 크기 제한
      switch (fileType) {
      case 'image':
        maxSize = 10 * 1024 * 1024; // 10MB
        sizeName = '10MB';
        break;
      case 'video':
      case 'file':
        maxSize = 50 * 1024 * 1024; // 50MB
        sizeName = '50MB';
        break;
      default:
        maxSize = 50 * 1024 * 1024; // 50MB
        sizeName = '50MB';
      }

      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (${sizeName} 초과)`);
      } else {
        validFiles.push(file);
      }
    });

    // 크기 초과 파일이 있으면 알림
    if (invalidFiles.length > 0) {
      alert(`다음 파일들은 크기 제한을 초과하여 제외되었습니다:\n${invalidFiles.join('\n')}`);
    }

    const newItems: UploadItem[] = validFiles.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      type: getFileType(file),
      status: 'pending',
      progress: 0,
    }));

    setUploadItems((prev: UploadItem[]) => [...prev, ...newItems]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const updateItemField = (id: string, field: keyof UploadItem, value: any) => {
    setUploadItems((prev: UploadItem[]) => prev.map((item: UploadItem) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setUploadItems((prev: UploadItem[]) => prev.filter((item: UploadItem) => item.id !== id));
  };

  const uploadSingleItem = async (item: UploadItem) => {
    updateItemField(item.id, 'status', 'uploading');
    updateItemField(item.id, 'progress', 0);

    try {
      let result: UploadResponse;

      switch (item.type) {
      case 'image':
        result = await uploadImageToServer(item.file, item.altText, userId);
        break;
      case 'video':
        result = await uploadVideoToServer(item.file, item.altText, userId);
        break;
      case 'file':
        result = await uploadFileToServer(item.file, item.displayName, userId);
        break;
      default:
        throw new Error('지원하지 않는 파일 타입입니다.');
      }

      updateItemField(item.id, 'result', result);
      updateItemField(item.id, 'status', result.success ? 'success' : 'error');
      updateItemField(item.id, 'progress', 100);
    } catch (error) {
      updateItemField(item.id, 'status', 'error');
      updateItemField(item.id, 'result', {
        success: false,
        message: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
      });
    }
  };

  const uploadAllItems = async () => {
    const pendingItems = uploadItems.filter((item: UploadItem) => item.status === 'pending');

    for (const item of pendingItems) {
      await uploadSingleItem(item);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
    case 'pending':
      return 'text-gray-600 bg-gray-100';
    case 'uploading':
      return 'text-blue-600 bg-blue-100';
    case 'success':
      return 'text-green-600 bg-green-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: UploadItem['status']) => {
    switch (status) {
    case 'pending':
      return '대기중';
    case 'uploading':
      return '업로드중';
    case 'success':
      return '완료';
    case 'error':
      return '실패';
    default:
      return '알 수 없음';
    }
  };

  const hasSuccessfulUploads = uploadItems.some((item: UploadItem) => item.status === 'success');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-none">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">파일 업로드</h1>
                <nav className="text-sm text-gray-600">
                  <Link href="/usermanage" className="hover:text-blue-600">
                    사용자 관리
                  </Link>
                  <span className="mx-2">/</span>
                  <Link href="/usermanage/media" className="hover:text-blue-600">
                    미디어 관리
                  </Link>
                  <span className="mx-2">/</span>
                  <span>파일 업로드</span>
                </nav>
              </div>
              <div className="flex space-x-4">
                <Link href="/usermanage/media" className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  취소
                </Link>
                {hasSuccessfulUploads && (
                  <button onClick={() => router.push('/usermanage/media')} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                    미디어 관리로 이동
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 파일 드롭 영역 */}
          <div
            className={`mb-8 rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mb-4 text-6xl">📁</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-700">파일을 여기에 드래그하거나 클릭하여 선택하세요</h3>
            <p className="mb-6 text-gray-500">이미지 (최대 10MB), 동영상 (최대 50MB), 문서 파일 (최대 50MB)</p>
            <input type="file" multiple onChange={handleFileSelect} className="hidden" id="file-input" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar" />
            <label htmlFor="file-input" className="inline-block cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
              파일 선택
            </label>
          </div>

          {/* 업로드 목록 */}
          {uploadItems.length > 0 && (
            <div className="mb-8 rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">업로드 목록 ({uploadItems.length}개)</h2>
                  <div className="space-x-2">
                    <button onClick={() => setUploadItems([])} className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100">
                      모두 제거
                    </button>
                    <button
                      onClick={uploadAllItems}
                      disabled={uploadItems.every((item: UploadItem) => item.status !== 'pending')}
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      모두 업로드
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {uploadItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      {/* 파일 미리보기 */}
                      <div className="flex-shrink-0">
                        {item.type === 'image' ? (
                          <img src={URL.createObjectURL(item.file)} alt={item.file.name} className="h-16 w-16 rounded object-cover" />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100">
                            <span className="text-2xl">{item.type === 'video' ? '🎥' : '📄'}</span>
                          </div>
                        )}
                      </div>

                      {/* 파일 정보 */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="truncate text-sm font-medium text-gray-900">{item.file.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>{getStatusText(item.status)}</span>
                            <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-600">
                              ✕
                            </button>
                          </div>
                        </div>

                        <p className="mb-3 text-sm text-gray-500">
                          {formatFileSize(item.file.size)} • {item.file.type}
                        </p>

                        {/* 메타데이터 입력 */}
                        {item.status === 'pending' && (
                          <div className="space-y-3">
                            {(item.type === 'image' || item.type === 'video') && (
                              <input
                                type="text"
                                placeholder="대체 텍스트 (선택사항)"
                                value={item.altText || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItemField(item.id, 'altText', e.target.value)}
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                            {item.type === 'file' && (
                              <input
                                type="text"
                                placeholder="표시 이름 (선택사항)"
                                value={item.displayName || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItemField(item.id, 'displayName', e.target.value)}
                                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                            <button onClick={() => uploadSingleItem(item)} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                              업로드
                            </button>
                          </div>
                        )}

                        {/* 업로드 진행률 */}
                        {item.status === 'uploading' && (
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${item.progress}%` }} />
                          </div>
                        )}

                        {/* 결과 표시 */}
                        {item.result && (
                          <div className="mt-3">
                            {item.result.success ? (
                              <div className="text-sm text-green-600">
                                ✅ 업로드 완료
                                {item.result.url && (
                                  <button onClick={() => navigator.clipboard.writeText(item.result!.url!)} className="ml-2 text-blue-600 hover:underline">
                                    URL 복사
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-red-600">❌ {item.result.message}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 업로드 가이드 */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">업로드 가이드</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="mb-2 text-3xl">🖼️</div>
                <h4 className="mb-1 font-medium text-gray-900">이미지</h4>
                <p className="text-sm text-gray-600">
                  JPG, PNG, GIF, WebP
                  <br />
                  최대 10MB
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="mb-2 text-3xl">🎥</div>
                <h4 className="mb-1 font-medium text-gray-900">동영상</h4>
                <p className="text-sm text-gray-600">
                  MP4, WebM, AVI
                  <br />
                  최대 50MB
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <div className="mb-2 text-3xl">📄</div>
                <h4 className="mb-1 font-medium text-gray-900">문서</h4>
                <p className="text-sm text-gray-600">
                  PDF, DOC, TXT, ZIP
                  <br />
                  최대 50MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
