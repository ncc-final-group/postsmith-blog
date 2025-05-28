'use client';
import Image from 'next/image';
import React, { useState } from 'react';

export interface Skin {
  id: string;
  name: string;
  thumbnail: string;
  isActive?: boolean;
}

type SkinListProps = {
  skins: Skin[];
  activeSkinId: string;
};

function SkinList({ skins, activeSkinId: initialActiveSkinId }: SkinListProps) {
  const [hoveredSkinId, setHoveredSkinId] = useState<string | null>(null);
  const [activeSkinId, setActiveSkinId] = useState(initialActiveSkinId);
  const activeSkin = skins.find((skin) => skin.id === activeSkinId);
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* 사용중인 스킨 */}
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-black">사용중인 스킨</h2>
        {activeSkin ? (
          <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4">
            <div className="group relative">
              <Image src={activeSkin.thumbnail} alt={activeSkin.name} width={120} height={80} className="rounded-md border" />
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/70 opacity-0 transition-opacity group-hover:opacity-100">
                <button className="z-20 rounded bg-gray-800 px-3 py-1 text-sm font-semibold text-white shadow">미리보기</button>
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-black">{activeSkin.name}</div>
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
                  {hoveredSkinId === skin.id && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-white/70">
                      <div className="flex gap-2">
                        <button className="z-20 rounded bg-gray-800 px-3 py-1 text-sm font-semibold text-white shadow">미리보기</button>
                        {!isActive && (
                          <button
                            className="z-20 rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSkinId(skin.id);
                            }}
                            tabIndex={0}
                          >
                            적용
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-1 font-medium text-gray-800">{skin.name}</div>
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
