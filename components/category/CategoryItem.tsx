//각 카테고리를 렌더링하는 재귀 컴포넌트

'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  isExpanded?: boolean; // 펼침 상태 추가
  showExpandButton?: boolean; // 화살표 버튼 표시 여부
}

export function CategoryItem({
  category,
  depth,
  moveItem,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  isExpanded = false, // 기본값은 접힘 상태
  showExpandButton = true, // 기본값은 true
}: CategoryItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isLocalExpanded, setIsLocalExpanded] = useState(isExpanded);

  // isExpanded prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setIsLocalExpanded(isExpanded);
  }, [isExpanded]);

  const handleAddChild = () => {
    alert('CategoryItem handleAddChild 호출됨');
    setIsLocalExpanded(true);
    onAdd();
  };

  const [{ isDragging }, dragRef] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging(), }),
  });

  const [{ isOver }, dropRef] = useDrop({
    accept: 'CATEGORY',
    drop: (dragged: { id: number }) => {
      console.log('CategoryItem drop', dragged.id, category.id);
      if (dragged.id !== category.id) {
        moveItem(dragged.id, category.id);
      }
    },
    canDrop: (dragged) => dragged.id !== category.id,
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }), }),
  });

  // ✅ ref에 드래그/드롭 연결
  useEffect(() => {
    if (ref.current) {
      dragRef(dropRef(ref.current));
    }
  }, [dragRef, dropRef]);

  const isRoot = depth === 0;
  const width = isRoot ? '800px' : '750px'; // 루트는 800px, 서브는 750px
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div
      ref={ref}
      className="transition-all duration-200"
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isOver ? '#e0f7fa' : undefined,
        border: isOver ? '2px dashed #00bcd4' : undefined,
        borderRadius: '0.5rem',
        width: width,
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
          padding: '0.5rem 1rem',
          width: '100%',
          marginLeft: isRoot ? '0' : '50px' // 루트가 아니면 50px 들여쓰기
        }}
      >
        <div className="flex items-center space-x-10">
          <span className="cursor-move text-gray-400 space-x-5 flex items-center">≡</span>
          {hasChildren && showExpandButton && (
            <button
              onClick={() => setIsLocalExpanded(!isLocalExpanded)}
              className="text-gray-400 hover:text-gray-600 transition-transform duration-200"
              style={{transform: isLocalExpanded ? 'rotate(90deg)' : 'rotate(0deg)',}}
            >
              ▶
            </button>
          )}
          <span className="font-medium">{category.name}</span>
          {category.description && (
            <span className="text-sm text-gray-400">{category.description}</span>
          )}
        </div>
        <div className="text-sm text-gray-500">0 posts</div>
        <CategoryActionMenu
          onAdd={handleAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onMove={onMove}
          isRoot={isRoot}
        />
      </div>

      {/* 자식 노드 재귀 렌더링 */}
      {hasChildren && isLocalExpanded && (
        <div className="mt-2 space-y-1">
          {category.children?.sort((a, b) => a.sequence - b.sequence)
            .map((child) => (
              <CategoryItem
                key={child.id}
                category={child}
                depth={depth + 1} // 부모의 depth + 1로 변경
                moveItem={moveItem}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                isExpanded={isExpanded}
                showExpandButton={false} // 서브 카테고리에서는 화살표 버튼 숨김
              />
            ))}
        </div>
      )}
    </div>
  );
}