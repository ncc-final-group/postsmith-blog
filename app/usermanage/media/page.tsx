'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  deleteMediaFile,
  deleteMediaFiles,
  formatFileSize,
  getFileTypeColor,
  getFileTypeIcon,
  getMediaFiles,
  getMediaStats,
  updateMediaFile,
  type MediaFile,
  type MediaStats,
  type MediaListResponse
} from '../../../lib/mediaService'

export default function MediaManagePage() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [mediaStats, setMediaStats] = useState<MediaStats | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<number[]>([])
  const [filterType, setFilterType] = useState<string>('')
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null)
  const [previewImage, setPreviewImage] = useState<MediaFile | null>(null)
  const [previewVideo, setPreviewVideo] = useState<MediaFile | null>(null)

  // 임시 사용자 ID (실제로는 인증된 사용자 정보에서 가져올 것)
  const userId = 1

  const loadMediaFiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getMediaFiles({
        userId,
        page: currentPage,
        size: 20,
        fileType: filterType || undefined,
        search: searchKeyword || undefined,
      })
      setMediaFiles(response.content)
      setTotalPages(response.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [currentPage, filterType, searchKeyword, userId])

  const loadMediaStats = useCallback(async () => {
    try {
      const stats = await getMediaStats(userId)
      setMediaStats(stats)
    } catch (err) {
      // 미디어 통계 로드 실패 시 처리
      setError(err instanceof Error ? err.message : '통계 로드에 실패했습니다.')
    }
  }, [userId])

  useEffect(() => {
    loadMediaFiles()
  }, [loadMediaFiles])

  useEffect(() => {
    loadMediaStats()
  }, [loadMediaStats])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCurrentPage(0)
    loadMediaFiles()
  }

  const handleFileSelect = (fileId: number) => {
    setSelectedFiles((prev: number[]) => 
      prev.includes(fileId) 
        ? prev.filter((id: number) => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === mediaFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(mediaFiles.map((file: MediaFile) => file.id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return
    
    if (!confirm(`선택된 ${selectedFiles.length}개 파일을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteMediaFiles(selectedFiles)
      setSelectedFiles([])
      await loadMediaFiles()
      await loadMediaStats()
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteSingle = async (fileId: number) => {
    if (!confirm('이 파일을 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteMediaFile(fileId)
      await loadMediaFiles()
      await loadMediaStats()
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEditFile = async (file: MediaFile) => {
    setEditingFile(file)
  }

  const handleUpdateFile = async (updateData: { altText?: string; description?: string }) => {
    if (!editingFile) return

    try {
      await updateMediaFile(editingFile.id, updateData)
      setEditingFile(null)
      await loadMediaFiles()
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정 중 오류가 발생했습니다.')
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    alert('URL이 클립보드에 복사되었습니다.')
  }

  const handleImageClick = (file: MediaFile) => {
    if (file.fileType === 'image') {
      setPreviewImage(file)
    } else if (file.fileType === 'video') {
      setPreviewVideo(file)
    }
  }

  if (loading && mediaFiles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">미디어 파일을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-none mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  미디어 관리
                </h1>
                <nav className="text-sm text-gray-600">
                  <Link href="/usermanage" className="hover:text-blue-600">
                    사용자 관리
                  </Link>
                  <span className="mx-2">/</span>
                  <span>미디어 관리</span>
                </nav>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {viewMode === 'grid' ? '목록 보기' : '그리드 보기'}
                </button>
                <Link
                  href="/usermanage/media/upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  파일 업로드
                </Link>
              </div>
            </div>
          </div>

          {/* 통계 */}
          {mediaStats && (
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-blue-600">
                  {mediaStats.totalCount}
                </div>
                <div className="text-sm text-gray-600">총 파일 수</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-green-600">
                  {formatFileSize(mediaStats.totalSize)}
                </div>
                <div className="text-sm text-gray-600">총 파일 크기</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">
                  {mediaStats.typeCounts.image || 0}
                </div>
                <div className="text-sm text-gray-600">이미지</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-2xl font-bold text-orange-600">
                  {mediaStats.typeCounts.video || 0}
                </div>
                <div className="text-sm text-gray-600">동영상</div>
              </div>
            </div>
          )}

          {/* 검색 및 필터 */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="파일명, 설명으로 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">모든 타입</option>
                <option value="image">이미지</option>
                <option value="video">동영상</option>
                <option value="file">파일</option>
              </select>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                검색
              </button>
            </form>
          </div>

          {/* 일괄 작업 바 */}
          {selectedFiles.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-800">
                  {selectedFiles.length}개 파일이 선택됨
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    선택 해제
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    선택된 파일 삭제
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 파일 목록 */}
          {error ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                업로드된 파일이 없습니다
              </h3>
              <p className="text-gray-500">
                첫 번째 파일을 업로드해보세요.
              </p>
            </div>
          ) : (
            <>
              {/* 파일 목록 헤더 */}
              <div className="bg-white p-4 rounded-t-lg border-b">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === mediaFiles.length}
                    onChange={handleSelectAll}
                    className="mr-4"
                  />
                  <span className="text-sm text-gray-600">
                    모두 선택 ({mediaFiles.length}개)
                  </span>
                </div>
              </div>

              {/* 그리드 뷰 */}
              {viewMode === 'grid' ? (
                <div className="bg-white p-6 rounded-b-lg shadow">
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {mediaFiles.map((file) => (
                      <div
                        key={file.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center mb-2">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => handleFileSelect(file.id)}
                            className="mr-2"
                          />
                        </div>
                        
                                                <div className="text-center mb-4">
                          {file.fileType === 'image' ? (
                            <div className="relative">
                              <img
                                src={file.fileUrl}
                                alt={file.altText || file.originalFileName}
                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleImageClick(file)}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `<div class="w-full h-32 bg-gray-200 rounded flex items-center justify-center"><span class="text-gray-500">이미지 로드 실패</span></div>`;
                                }}
                              />
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                IMG
                              </div>
                            </div>
                          ) : file.fileType === 'video' ? (
                            <div className="relative">
                              <video
                                src={file.fileUrl}
                                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
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
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black bg-opacity-50 rounded-full p-3">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                  </svg>
                                </div>
                              </div>
                              <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                VIDEO
                              </div>
                            </div>
                          ) : (
                            <div className={`w-full h-32 rounded flex flex-col items-center justify-center ${getFileTypeColor(file.fileType, file.mimeType)} border-2 border-dashed border-gray-300`}>
                              <span className="text-4xl mb-2">
                                {getFileTypeIcon(file.fileType, file.mimeType)}
                              </span>
                              <span className="text-xs font-medium text-center px-2">
                                {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                              </span>
                              <span className="text-xs text-gray-500 mt-1">
                                파일
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900 truncate" title={file.originalFileName}>
                            {file.originalFileName}
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.fileSize)}
                            </p>
                            {file.fileType !== 'image' && (
                              <span className={`text-xs px-2 py-1 rounded ${getFileTypeColor(file.fileType, file.mimeType)}`}>
                                {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex space-x-1 mt-4">
                          <button
                            onClick={() => copyToClipboard(file.fileUrl)}
                            className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                          >
                            복사
                          </button>
                          <button
                            onClick={() => handleEditFile(file)}
                            className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDeleteSingle(file.id)}
                            className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 리스트 뷰 */
                <div className="bg-white rounded-b-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedFiles.length === mediaFiles.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          파일명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          타입
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          크기
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업로드일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mediaFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => handleFileSelect(file.id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {file.fileType === 'image' ? (
                                                                      <img
                                      src={file.fileUrl}
                                      alt={file.altText || file.originalFileName}
                                      className="h-10 w-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => handleImageClick(file)}
                                    />
                                ) : (
                                  <div className={`h-10 w-10 rounded flex items-center justify-center ${getFileTypeColor(file.fileType, file.mimeType)}`}>
                                    <span className="text-xl">
                                      {getFileTypeIcon(file.fileType, file.mimeType)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {file.originalFileName}
                                </div>
                                {file.altText && (
                                  <div className="text-sm text-gray-500">
                                    {file.altText}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {file.fileType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(file.fileSize)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => copyToClipboard(file.fileUrl)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              복사
                            </button>
                            <button
                              onClick={() => handleEditFile(file)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              편집
                            </button>
                            <button
                              onClick={() => handleDeleteSingle(file.id)}
                              className="text-red-600 hover:text-red-900"
                            >
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
                <div className="flex justify-center space-x-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  <span className="px-4 py-2 text-gray-600">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">파일 정보 편집</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateFile({
                  altText: formData.get('altText') as string,
                  description: formData.get('description') as string,
                })
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대체 텍스트
                </label>
                <input
                  type="text"
                  name="altText"
                  defaultValue={editingFile.altText || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingFile.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
              )}

      {/* 비디오 미리보기 모달 */}
      {previewVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewVideo(null)}
        >
          <div 
            className="bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{previewVideo.originalFileName}</h3>
              <button
                onClick={() => setPreviewVideo(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <video
                src={previewVideo.fileUrl}
                controls
                className="max-w-full max-h-[70vh] mx-auto"
              >
                브라우저가 비디오를 지원하지 않습니다.
              </video>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>크기: {formatFileSize(previewVideo.fileSize)}</p>
              <p>타입: {previewVideo.mimeType}</p>
              {previewVideo.description && <p>설명: {previewVideo.description}</p>}
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => copyToClipboard(previewVideo.fileUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                URL 복사
              </button>
              <button
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 미리보기 모달 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-white p-6 rounded-lg max-w-4xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{previewImage.originalFileName}</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <img
                src={previewImage.fileUrl}
                alt={previewImage.altText || previewImage.originalFileName}
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>크기: {formatFileSize(previewImage.fileSize)}</p>
              <p>타입: {previewImage.mimeType}</p>
              {previewImage.altText && <p>대체 텍스트: {previewImage.altText}</p>}
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => copyToClipboard(previewImage.fileUrl)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                URL 복사
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 