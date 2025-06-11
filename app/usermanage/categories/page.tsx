'use client';

import { Category, CategoryTree } from '@components/category/CategoryTree';

export default function CategoriesPage() {
  // 예시 mock 데이터 (depth 포함 구조)
  const categories: Category[] = [
    {
      id: 1,
      name: 'A',
      description: '일반 카테고리 A',
      parentId: null,
      sequence: 1,
      children: [
        {
          id: 2,
          name: 'A-1',
          description: '서브 카테고리 A-1',
          parentId: 1,
          sequence: 1,
          children: [
            {
              id: 3,
              name: 'A-1-1',
              description: '서브 서브 A-1-1',
              parentId: 2,
              sequence: 1,
              children: [],
            },
          ],
        },
        {
          id: 4,
          name: 'A-2',
          description: '서브 카테고리 A-2',
          parentId: 1,
          sequence: 2,
          children: [],
        },
      ],
    },
    {
      id: 5,
      name: 'B',
      description: '일반 카테고리 B',
      parentId: null,
      sequence: 2,
      children: [
        {
          id: 6,
          name: 'B-1',
          description: '서브 카테고리 B-1',
          parentId: 5,
          sequence: 1,
          children: [],
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-800 mb-4">카테고리 관리</h1>
      <CategoryTree categories={categories} />
    </div>
  );
}
