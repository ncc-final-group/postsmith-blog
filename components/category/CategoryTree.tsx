'use client';

import React from 'react';

import { CategoryItem } from "./CategoryItem";


export interface Category{
  id: number;
  name: string;
  description?: string;
  sequence: number;
  parentId?: number | null;
  //depth: number;
  children?: Category[]; // client에서 트리화해서 씀
}
interface CategoryTreeProps {
  categories: Category[];
}

// 루트 카테고리들을 받아서 트리 구조 렌더링
export function CategoryTree({ categories }: CategoryTreeProps) {
  return (
    <div
      className="overflow-auto max-h-[490px]"
      style={{ minWidth: '780px', width: '100%' }}
    >
      <div className="space-y-2">
        {categories
          .sort((a, b) => a.sequence - b.sequence)
          .map((category) => (
            <CategoryItem key={category.id} category={category} depth={0} />
          ))}
      </div>
    </div>
  );
}
