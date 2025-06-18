'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Category } from '../../types/blog';

interface CategoryActionMenuProps {
  category: Category; // 👈 이거 props로 추가해야 함
  onAdd: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onMove: () => void;
  isRoot?: boolean;
}

export default function CategoryActionMenu({ category, onAdd, onEdit, onDelete, onMove, isRoot = false }: CategoryActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button className="rounded p-1 hover:bg-gray-200 focus:ring focus:outline-none" onClick={() => setOpen(!open)} aria-label="카테고리 액션 메뉴 열기">
        {/* 점 3개 아이콘 */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx={5} cy={12} r={2} />
          <circle cx={12} cy={12} r={2} />
          <circle cx={19} cy={12} r={2} />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-40 rounded border border-gray-200 bg-white shadow-lg">
          {isRoot && (
            <button
              onClick={() => {
                onAdd();
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              하위 카테고리 추가
            </button>
          )}
          <button
            onClick={() => {
              onEdit(category.id);
              setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            수정
          </button>
          <button
            onClick={() => {
              onMove();
              setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            이동
          </button>
          <button
            onClick={() => {
              onDelete(category.id);
              setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
