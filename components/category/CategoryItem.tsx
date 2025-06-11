//각 카테고리를 렌더링하는 재귀 컴포넌트

'use client';

import React from 'react';

import { Category } from './CategoryTree';

interface CategoryItemProps {
  category: Category;
  depth: number; // 들여쓰기 깊이
}

export function CategoryItem({ category, depth }: CategoryItemProps) {
  const isRoot = category.parentId === null;

  return (
    <div className={isRoot ? '' : 'ml-8'}>
      <div
        className={
          'flex flex-col border p-2 rounded-md bg-white shadow-sm ' +
          (isRoot
            ? 'text-base font-semibold text-gray-900'
            : 'text-sm font-normal text-gray-700 bg-gray-50')
        }
      >
        <div className="flex justify-between items-center">
          <span>{category.name}</span>
          <span className="text-xs text-gray-400">seq: {category.sequence}</span>
        </div>
        {category.description && (
          <div className="text-xs text-gray-500 mt-1">{category.description}</div>
        )}
      </div>

      {/* 자식 카테고리 재귀 렌더링 */}
      {(category.children && category.children.length > 0) && (
        <div className="mt-2 space-y-1">
          {category.children
            .sort((a, b) => a.sequence - b.sequence)
            .map((child) => (
              <CategoryItem
                key={child.id}
                category={child}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
