//각 카테고리를 렌더링하는 재귀 컴포넌트

'use client';

import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import CategoryActionMenu from './CategoryActionMenu';

import { Category } from './CategoryTree';

interface CategoryItemProps {
  category: Category;
  depth: number; // 들여쓰기 깊이
  moveItem: (dragId: number, targetId: number) => void;
}




export function CategoryItem({ category, depth, moveItem }: CategoryItemProps) {
  const isRoot = category.parentId === null;
  const ref = useRef<HTMLDivElement | null>(null);



  const [{ isDragging }, dragRef] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging(), }),
  });

  const [{ isOver }, dropRef] = useDrop({
    accept: 'CATEGORY',
    drop: (dragged: { id: number }) => {
      if (dragged.id === category.id) return;
      moveItem(dragged.id, category.id);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  // ref 연결
  dragRef(dropRef(ref));


  return (
    <div
      ref={ref}
      className={`transition-all duration-200 ${isRoot ? '' : 'ml-8'}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver ? '#e0f7fa' : undefined, // 밝은 하늘색 강조
        border: isOver ? '2px dashed #00bcd4' : undefined,
        borderRadius: '0.5rem',
      }}
    >
      <div
        className={
          'flex items-center justify-between border p-2 rounded-md bg-white shadow-sm h-15 w-min-[450px] ' +
          (isRoot
            ? 'text-base font-semibold text-gray-900'
            : 'text-sm font-normal text-gray-700 bg-gray-50')
        }
        style={{ paddingLeft: `${depth * 8}px` ,padding: '0.5rem 1rem' }}
      >
        {/* 왼쪽: 드래그 핸들 + 이름 + 설명 */}
        <div className="flex items-center space-x-10">
          <span className="cursor-move text-gray-400 space-x-5 flex items-center">≡</span>
          <span className="font-medium">{category.name}</span>
          {category.description && (
            <span className="text-sm text-gray-400">{category.description}</span>
          )}
        </div>

        {/* 오른쪽: Post 수 (임시 dummy 값) */}
        <div className="text-sm text-gray-500">0 posts</div>
        <CategoryActionMenu
          onAdd={() => console.log('Add')}
          onEdit={() => console.log('Edit')}
          onDelete={() => console.log('Delete')}
          onMove={() => console.log('Move')}
        />
      </div>

      {category.children && category.children.length > 0 && (
        <div className="mt-2 space-y-1">
          {category.children
            .sort((a, b) => a.sequence - b.sequence)
            .map((child) => (
              <CategoryItem
                key={child.id}
                category={child}
                depth={depth + 1}
                moveItem={moveItem}
              />
            ))}
        </div>
      )}
    </div>
  );
}