'use client';
import Image from 'next/image';
import React, { useState } from 'react';

import { updateBlogTheme } from '../lib/skinService';

export interface Skin {
  id: string;
  name: string;
  thumbnail: string;
  description?: string;
  themeHtml?: string;
  themeCss?: string;
  isActive?: boolean;
  author?: string;
  authorLink?: string;
}

type SkinListProps = {
  skins: Skin[];
  activeSkinId: string;
  blogId: number; // 블로그 ID (필수)
};

function SkinList({ skins, activeSkinId: initialActiveSkinId, blogId }: SkinListProps) {
  const [hoveredSkinId, setHoveredSkinId] = useState<string | null>(null);
  const [activeSkinId, setActiveSkinId] = useState(initialActiveSkinId);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // 업데이트 중인 스킨 ID
  const activeSkin = skins.find((skin) => skin.id === activeSkinId);

  // 테마 적용 핸들러
  const handleApplyTheme = async (themeId: string) => {
    setIsUpdating(themeId);

    try {
      const result = await updateBlogTheme(blogId, themeId);

      if (result.success) {
        setActiveSkinId(themeId);
        alert('테마가 성공적으로 적용되었습니다!');
        // 페이지 새로고침하여 최신 상태 반영
        window.location.reload();
      } else {
        alert(`테마 적용 실패: ${result.error}`);
      }
    } catch (error) {
      alert('테마 적용 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(null);
    }
  };
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* 사용중인 스킨 */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-black">사용중인 스킨</h2>
        {activeSkin ? (
          <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center gap-4">
              <div className="group relative">
                <Image src={activeSkin.thumbnail} alt={activeSkin.name} width={120} height={80} className="rounded-md border" />
              </div>
              <div>
                <div className="text-base font-bold text-black">{activeSkin.name}</div>
                {activeSkin.description && <div className="mt-1 text-sm text-gray-600">{activeSkin.description}</div>}
              </div>
            </div>
            <div className="flex-shrink-0">
              <button
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-green-700"
                onClick={() => {
                  window.location.href = `/skin-editor`;
                }}
              >
                편집
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">사용중인 스킨이 없습니다.</div>
        )}
      </section>
      {/* 스킨 목록 */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-black">스킨 목록</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {skins.map((skin) => {
            const isActive = skin.id === activeSkinId;
            return (
              <div
                key={skin.id}
                className={`relative flex flex-col items-center rounded-lg border bg-white p-3 transition-all duration-200 ${isActive ? 'ring-2 ring-blue-400' : ''}`}
                onMouseEnter={() => setHoveredSkinId(skin.id)}
                onMouseLeave={() => setHoveredSkinId(null)}
                tabIndex={0}
                style={{ outline: isActive ? '2px solid #60a5fa' : undefined }}
              >
                <div className="group relative flex w-full flex-col items-center">
                  <Image src={skin.thumbnail} alt={skin.name} width={180} height={120} className="mb-2 rounded-md border" />
                  {/* Hover Layer */}
                  {hoveredSkinId === skin.id && !isActive && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-white/70">
                      <button
                        className="z-20 rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white shadow focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTheme(skin.id);
                        }}
                        disabled={isUpdating === skin.id}
                        tabIndex={0}
                      >
                        {isUpdating === skin.id ? '적용 중...' : '적용'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-1 font-medium text-gray-800">{skin.name}</div>
                {skin.description && <div className="mb-1 line-clamp-2 text-xs text-gray-500">{skin.description}</div>}
                {isActive && <span className="text-xs font-semibold text-blue-600">사용중</span>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default SkinList;
