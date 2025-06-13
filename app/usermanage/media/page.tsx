'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

import {
  deleteMediaFile,
  deleteMediaFiles,
  formatFileSize,
  getFileTypeColor,
  getFileTypeIcon,
  getMediaFiles,
  getMediaStats,
  type MediaFile,
  type MediaListResponse,
  type MediaStats,
  updateMediaFile,
} from '../../../lib/mediaService';

export default function MediaManagePage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null);
  const [previewImage, setPreviewImage] = useState<MediaFile | null>(null);
  const [previewVideo, setPreviewVideo] = useState<MediaFile | null>(null);

  // 임시 사용자 ID (실제로는 인증된 사용자 정보에서 가져올 것)
  const userId = 1;

  const loadMediaFiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getMediaFiles({
        userId,
        page: currentPage,
        size: 20,
        fileType: filterType || undefined,
        search: searchKeyword || undefined,
      });
      setMediaFiles(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterType, searchKeyword, userId]);

  const loadMediaStats = useCallback(async () => {
    try {
      const stats = await getMediaStats(userId);
      setMediaStats(stats);
    } catch (err) {
      // 미디어 통계 로드 실패 시 처리
      setError(err instanceof Error ? err.message : '통계 로드에 실패했습니다.');
    }
  }, [userId]);

  useEffect(() => {
    loadMediaFiles();
  }, [loadMediaFiles]);

  useEffect(() => {
    loadMediaStats();
  }, [loadMediaStats]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(0);
    loadMediaFiles();
  };

  const handleFileSelect = (fileId: number) => {
    setSelectedFiles((prev: number[]) => (prev.includes(fileId) ? prev.filter((id: number) => id !== fileId) : [...prev, fileId]));
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === mediaFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(mediaFiles.map((file: MediaFile) => file.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return;

    if (!confirm(`선택된 ${selectedFiles.length}개 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteMediaFiles(selectedFiles);
      setSelectedFiles([]);
      await loadMediaFiles();
      await loadMediaStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteSingle = async (fileId: number) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteMediaFile(fileId);
      await loadMediaFiles();
      await loadMediaStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditFile = async (file: MediaFile) => {
    setEditingFile(file);
  };

  const handleUpdateFile = async (updateData: { altText?: string; description?: string }) => {
    if (!editingFile) return;

    try {
      await updateMediaFile(editingFile.id, updateData);
      setEditingFile(null);
      await loadMediaFiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('URL이 클립보드에 복사되었습니다.');
  };

  const handleImageClick = (file: MediaFile) => {
    if (file.fileType === 'image') {
      setPreviewImage(file);
    } else if (file.fileType === 'video') {
      setPreviewVideo(file);
    }
  };

  if (loading && mediaFiles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">미디어 파일을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-none">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-gray-900">미디어 관리</h1>
                <nav className="text-sm text-gray-600">
                  <Link href="/usermanage" className="hover:text-blue-600">
                    사용자 관리
                  </Link>
                  <span className="mx-2">/</span>
                  <span>미디어 관리</span>
                </nav>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50">
                  {viewMode === 'grid' ? '목록 보기' : '그리드 보기'}
                </button>
                <Link href="/usermanage/media/upload" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  파일 업로드
                </Link>
              </div>
            </div>
          </div>

          {/* 통계 */}
          {mediaStats && (
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="text-2xl font-bold text-blue-600">{mediaStats.totalCount}</div>
                <div className="text-sm text-gray-600">총 파일 수</div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="text-2xl font-bold text-green-600">{formatFileSize(mediaStats.totalSize)}</div>
                <div className="text-sm text-gray-600">총 파일 크기</div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="text-2xl font-bold text-purple-600">{mediaStats.typeCounts.image || 0}</div>
                <div className="text-sm text-gray-600">이미지</div>
              </div>
              <div className="rounded-lg bg-white p-6 shadow">
                <div className="text-2xl font-bold text-orange-600">{mediaStats.typeCounts.video || 0}</div>
                <div className="text-sm text-gray-600">동영상</div>
              </div>
            </div>
          )}

          {/* 검색 및 필터 */}
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="min-w-64 flex-1">
                <input
                  type="text"
                  placeholder="파일명, 설명으로 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500">
                <option value="">모든 타입</option>
                <option value="image">이미지</option>
                <option value="video">동영상</option>
                <option value="file">파일</option>
              </select>
              <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                검색
              </button>
            </form>
          </div>

          {/* 일괄 작업 바 */}
          {selectedFiles.length > 0 && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">{selectedFiles.length}개 파일이 선택됨</span>
                <div className="space-x-2">
                  <button onClick={() => setSelectedFiles([])} className="rounded px-4 py-2 text-blue-600 hover:bg-blue-100">
                    선택 해제
                  </button>
                  <button onClick={handleDeleteSelected} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                    선택된 파일 삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 파일 목록 */}
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <div className="mb-4 text-6xl">📁</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-600">업로드된 파일이 없습니다</h3>
              <p className="text-gray-500">첫 번째 파일을 업로드해보세요.</p>
            </div>
          ) : (
            <>
              {/* 파일 목록 헤더 */}
              <div className="rounded-t-lg border-b bg-white p-4">
                <div className="flex items-center">
                  <input type="checkbox" checked={selectedFiles.length === mediaFiles.length} onChange={handleSelectAll} className="mr-4" />
                  <span className="text-sm text-gray-600">모두 선택 ({mediaFiles.length}개)</span>
                </div>
              </div>

              {/* 그리드 뷰 */}
              {viewMode === 'grid' ? (
                <div className="rounded-b-lg bg-white p-6 shadow">
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {mediaFiles.map((file) => (
                      <div key={file.id} className="rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-md">
                        <div className="mb-2 flex items-center">
                          <input type="checkbox" checked={selectedFiles.includes(file.id)} onChange={() => handleFileSelect(file.id)} className="mr-2" />
                        </div>

                        <div className="mb-4 text-center">
                          {file.fileType === 'image' ? (
                            <div className="relative">
                              <img
                                src={file.fileUrl}
                                alt={file.altText || file.originalFileName}
                                className="h-32 w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                                onClick={() => handleImageClick(file)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `<div class="w-full h-32 bg-gray-200 rounded flex items-center justify-center"><span class="text-gray-500">이미지 로드 실패</span></div>`;
                                }}
                              />
                              <div className="bg-opacity-50 absolute right-1 bottom-1 rounded bg-black px-1 text-xs text-white">IMG</div>
                            </div>
                          ) : file.fileType === 'video' ? (
                            <div className="relative">
                              <video
                                src={file.fileUrl}
                                className="h-32 w-full cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                                onClick={() => handleImageClick(file)}
                                muted
                                preload="metadata"
                                onError={(e) => {
                                  const target = e.target as HTMLVideoElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `
                                    <div class="w-full h-32 ${getFileTypeColor(file.fileType, file.mimeType)} rounded flex flex-col items-center justify-center cursor-pointer hover:opacity-80" onclick="handleImageClick(file)">
                                      <span class="text-4xl mb-2">${getFileTypeIcon(file.fileType, file.mimeType)}</span>
                                      <span class="text-xs font-medium">동영상 (클릭하여 재생)</span>
                                      <div class="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">VIDEO</div>
                                    </div>
                                  `;
                                }}
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="bg-opacity-50 rounded-full bg-black p-3">
                                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="bg-opacity-50 absolute right-1 bottom-1 rounded bg-black px-1 text-xs text-white">VIDEO</div>
                            </div>
                          ) : (
                            <div
                              className={`flex h-32 w-full flex-col items-center justify-center rounded ${getFileTypeColor(file.fileType, file.mimeType)} border-2 border-dashed border-gray-300`}
                            >
                              <span className="mb-2 text-4xl">{getFileTypeIcon(file.fileType, file.mimeType)}</span>
                              <span className="px-2 text-center text-xs font-medium">{file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                              <span className="mt-1 text-xs text-gray-500">파일</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="truncate text-sm font-medium text-gray-900" title={file.originalFileName}>
                            {file.originalFileName}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</p>
                            {file.fileType !== 'image' && (
                              <span className={`rounded px-2 py-1 text-xs ${getFileTypeColor(file.fileType, file.mimeType)}`}>
                                {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</p>
                        </div>

                        <div className="mt-4 flex space-x-1">
                          <button onClick={() => copyToClipboard(file.fileUrl)} className="flex-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-200">
                            복사
                          </button>
                          <button onClick={() => handleEditFile(file)} className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200">
                            편집
                          </button>
                          <button onClick={() => handleDeleteSingle(file.id)} className="flex-1 rounded bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200">
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 리스트 뷰 */
                <div className="overflow-hidden rounded-b-lg bg-white shadow">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                          <input type="checkbox" checked={selectedFiles.length === mediaFiles.length} onChange={handleSelectAll} />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">파일명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">타입</th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">크기</th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">업로드일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {mediaFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" checked={selectedFiles.includes(file.id)} onChange={() => handleFileSelect(file.id)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {file.fileType === 'image' ? (
                                  <img
                                    src={file.fileUrl}
                                    alt={file.altText || file.originalFileName}
                                    className="h-10 w-10 cursor-pointer rounded object-cover transition-opacity hover:opacity-80"
                                    onClick={() => handleImageClick(file)}
                                  />
                                ) : (
                                  <div className={`flex h-10 w-10 items-center justify-center rounded ${getFileTypeColor(file.fileType, file.mimeType)}`}>
                                    <span className="text-xl">{getFileTypeIcon(file.fileType, file.mimeType)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{file.originalFileName}</div>
                                {file.altText && <div className="text-sm text-gray-500">{file.altText}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs leading-5 font-semibold text-gray-800">{file.fileType}</span>
                          </td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{formatFileSize(file.fileSize)}</td>
                          <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</td>
                          <td className="space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap">
                            <button onClick={() => copyToClipboard(file.fileUrl)} className="text-blue-600 hover:text-blue-900">
                              복사
                            </button>
                            <button onClick={() => handleEditFile(file)} className="text-indigo-600 hover:text-indigo-900">
                              편집
                            </button>
                            <button onClick={() => handleDeleteSingle(file.id)} className="text-red-600 hover:text-red-900">
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    이전
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      {editingFile && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">파일 정보 편집</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateFile({
                  altText: formData.get('altText') as string,
                  description: formData.get('description') as string,
                });
              }}
            >
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700">대체 텍스트</label>
                <input
                  type="text"
                  name="altText"
                  defaultValue={editingFile.altText || ''}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">설명</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingFile.description || ''}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-4">
                <button type="button" onClick={() => setEditingFile(null)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
                  취소
                </button>
                <button type="submit" className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비디오 미리보기 모달 */}
      {previewVideo && (
        <div className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={() => setPreviewVideo(null)}>
          <div className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{previewVideo.originalFileName}</h3>
              <button onClick={() => setPreviewVideo(null)} className="text-2xl text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="text-center">
              <video src={previewVideo.fileUrl} controls className="mx-auto max-h-[70vh] max-w-full">
                브라우저가 비디오를 지원하지 않습니다.
              </video>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>크기: {formatFileSize(previewVideo.fileSize)}</p>
              <p>타입: {previewVideo.mimeType}</p>
              {previewVideo.description && <p>설명: {previewVideo.description}</p>}
            </div>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => copyToClipboard(previewVideo.fileUrl)} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                URL 복사
              </button>
              <button onClick={() => setPreviewVideo(null)} className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[90vh] max-w-4xl overflow-auto rounded-lg bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{previewImage.originalFileName}</h3>
              <button onClick={() => setPreviewImage(null)} className="text-2xl text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>
            <div className="text-center">
              <img src={previewImage.fileUrl} alt={previewImage.altText || previewImage.originalFileName} className="mx-auto max-h-[70vh] max-w-full object-contain" />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>크기: {formatFileSize(previewImage.fileSize)}</p>
              <p>타입: {previewImage.mimeType}</p>
              {previewImage.altText && <p>대체 텍스트: {previewImage.altText}</p>}
            </div>
            <div className="mt-4 flex space-x-2">
              <button onClick={() => copyToClipboard(previewImage.fileUrl)} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                URL 복사
              </button>
              <button onClick={() => setPreviewImage(null)} className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
