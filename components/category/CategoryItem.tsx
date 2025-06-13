//각 카테고리를 렌더링하는 재귀 컴포넌트

'use client';

import React, { useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import CategoryActionMenu from './CategoryActionMenu';
import { Category } from './CategoryTree';

interface CategoryItemProps {
  category: Category;
  depth: number; // 들여쓰기 깊이
  moveItem: (dragId: number, targetId: number) => void;
  onAdd: () => void | Promise<void>;
  onEdit: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  onMove: () => void | Promise<void>;
}




export function CategoryItem({
  category,
  depth,
  moveItem,
  onAdd,
  onEdit,
  onDelete,
  onMove, 
}: CategoryItemProps) {
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
      if (dragged.id !== category.id) {
        moveItem(dragged.id, category.id);
      }
    },
    canDrop: (dragged) => dragged.id !== category.id,
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }), })// 🔥 자식 드롭 중첩 방지}),
  });

  // ✅ ref에 드래그/드롭 연결
  useEffect(() => {
    if (ref.current) {
      dragRef(dropRef(ref.current));
    }
  }, [dragRef, dropRef]);


  return (
    <div
      ref={ref}
      className={`transition-all duration-200 ${isRoot ? '' : 'ml-8'}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver ? '#e0f7fa' : undefined,
        border: isOver ? '2px dashed #00bcd4' : undefined,
        borderRadius: '0.5rem',
      }}
    >
      <div
        className={
          'flex items-center justify-between border p-2 rounded-md bg-white shadow-sm h-15' +
          (isRoot
            ? 'text-base font-semibold text-gray-900'
            : 'text-sm font-normal text-gray-700 bg-gray-50')
        }
        style={{
          paddingLeft: `${depth * 8}px`,
          padding: '0.5rem 1rem',
          minWidth: '500px'
        }}
      >
        <div className="flex items-center space-x-10">
          <span className="cursor-move text-gray-400 space-x-5 flex items-center">≡</span>
          <span className="font-medium">{category.name}</span>
          {category.description && (
            <span className="text-sm text-gray-400">{category.description}</span>
          )}
        </div>
        <div className="text-sm text-gray-500">0 posts</div>
        <CategoryActionMenu
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
        />
      </div>

      {/* 자식 노드 재귀 렌더링 */}
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
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
              />
            ))}
        </div>
      )}
    </div>
  );
}