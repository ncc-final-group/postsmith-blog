'use client';
import Image from 'next/image';
import React, { useCallback, useEffect, useState } from 'react';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  tags?: string[];
  color?: string;
}

type PluginModalProps = {
  plugin: Plugin;
  open: boolean;
  onClose: () => void;
  isActive: boolean;
  onApply: () => void;
  onDeactivate: () => void;
};

function PluginModal({ plugin, open, onClose, isActive, onApply, onDeactivate }: PluginModalProps) {
  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 transition-opacity" style={{ background: 'rgba(243, 244, 246, 0.7)' }} onClick={onClose} />
      {/* Modal */}
      <div className="animate-fadeIn relative z-10 mx-4 flex w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-xl" style={{ minHeight: '580px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="text-lg font-bold text-black">{plugin.name}</div>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-black">
            ×
          </button>
        </div>
        {/* Body */}
        <div className="flex flex-grow flex-col items-center px-6 py-6">
          <div className="mb-4 flex w-full items-center justify-center">
            {plugin.iconUrl ? (
              <Image src={plugin.iconUrl} alt={plugin.name} width={384} height={240} className="rounded border bg-gray-100 object-contain" />
            ) : (
              <div className="flex h-60 w-96 items-center justify-center rounded bg-blue-400 text-2xl font-bold text-white">{plugin.name}</div>
            )}
          </div>
          <div className="mb-2 text-center text-base text-gray-800">{plugin.description}</div>
          {plugin.tags && plugin.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {plugin.tags.map((tag) => (
                <span key={tag} className="text-xs text-gray-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex justify-end border-t bg-white px-6 py-4" style={{ marginBottom: '20px', marginRight: '10px' }}>
          {isActive ? (
            <button className="rounded bg-red-600 px-6 py-2 font-semibold text-white transition hover:bg-red-700" onClick={onDeactivate}>
              해제
            </button>
          ) : (
            <button className="rounded bg-black px-6 py-2 font-semibold text-white transition hover:bg-gray-800" onClick={onApply}>
              적용
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type PluginListProps = {
  plugins: Plugin[];
  activePluginIds: string[];
};

function PluginList({ plugins, activePluginIds: initialActivePluginIds }: PluginListProps) {
  const [modalPlugin, setModalPlugin] = useState<Plugin | null>(null);
  const [activePluginIds, setActivePluginIds] = useState<string[]>(initialActivePluginIds);

  const handleCardClick = useCallback((plugin: Plugin) => {
    setModalPlugin(plugin);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalPlugin(null);
  }, []);

  const handleApply = useCallback((pluginId: string) => {
    setActivePluginIds((prev) => [...prev, pluginId]);
    setModalPlugin(null);
  }, []);

  const handleDeactivate = useCallback((pluginId: string) => {
    setActivePluginIds((prev) => prev.filter((id) => id !== pluginId));
    setModalPlugin(null);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">전체 플러그인</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {plugins.map((plugin) => {
          const isActive = activePluginIds.includes(plugin.id);
          return (
            <div
              key={plugin.id}
              className={
                `relative flex h-[260px] min-h-[260px] cursor-pointer flex-col overflow-hidden rounded-lg border bg-white p-0 shadow-sm ` + (isActive ? 'ring-2 ring-red-400' : '')
              }
              style={{ minHeight: 260, height: 260 }}
              onClick={() => handleCardClick(plugin)}
            >
              {/* 상단 이미지 영역 (50%) */}
              <div className="relative h-1/2 min-h-[50%] w-full flex-shrink-0 flex-grow-0" style={{ height: '50%' }}>
                {isActive && <span className="absolute top-2 left-2 z-10 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">사용중</span>}
                {plugin.iconUrl ? (
                  <Image src={plugin.iconUrl} alt={plugin.name} width={384} height={240} className="rounded border bg-gray-100 object-contain" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-blue-400 text-2xl font-bold text-white">{plugin.name}</div>
                )}
              </div>
              {/* 하단 텍스트 영역 (50%) */}
              <div className="flex h-1/2 min-h-[50%] flex-grow flex-col justify-between p-4">
                <div>
                  <div className="mb-1 text-base font-bold text-black">{plugin.name}</div>
                  <div className="mb-2 line-clamp-2 text-sm text-gray-800">{plugin.description}</div>
                </div>
                {plugin.tags && plugin.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {plugin.tags.map((tag) => (
                      <span key={tag} className="text-xs text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* 모달 */}
      {modalPlugin && (
        <PluginModal
          plugin={modalPlugin}
          open={!!modalPlugin}
          isActive={activePluginIds.includes(modalPlugin.id)}
          onClose={handleCloseModal}
          onApply={() => handleApply(modalPlugin.id)}
          onDeactivate={() => handleDeactivate(modalPlugin.id)}
        />
      )}
    </div>
  );
}

export default PluginList;
