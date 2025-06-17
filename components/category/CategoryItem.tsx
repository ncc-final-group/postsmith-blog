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
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onMove: (id: number) => void | Promise<void>;
  isExpanded?: boolean; // 펼침 상태 추가
  showExpandButton?: boolean; // 화살표 버튼 표시 여부
  onChangeOrder?: (category: Category, direction: "up" | "down") => void;
  localCategories: Category[]; // 추가
  editingCategoryId: number | null;
  setEditingCategoryId: (id: number | null) => void;
  onLocalEdit: (id: number) => void;
  editingCategory: Category | null;
  onSaveEdit: (name: string, description: string) => void;
  onCancelEdit: () => void;
  setLocalCategories: (categories: Category[]) => void;
  setIsDirty: (dirty: boolean) => void;
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
  onChangeOrder,
  localCategories,
  editingCategoryId,
  setEditingCategoryId,
  setLocalCategories,
  onSaveEdit,
  onCancelEdit,
  onLocalEdit,
  setIsDirty,
  editingCategory, // ✅ props로 받음
}: CategoryItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isLocalExpanded, setIsLocalExpanded] = useState(isExpanded);
  const [editName, setEditName] = useState(editingCategory?.name ?? '');
  const [editDescription, setEditDescription] = useState(editingCategory?.description ?? '');



  // isExpanded prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setIsLocalExpanded(isExpanded);
  }, [isExpanded]);

  const handleAddChild = () => {
    setIsLocalExpanded(true);
    onAdd();
  };

  const [{ isDragging }, dragRef] = useDrag({
    type: 'CATEGORY',
    item: { id: category.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging(), }),
  });

  const [isHovered, setIsHovered] = useState(false);


  const [{ isOver }, dropRef] = useDrop({
    accept: 'CATEGORY',
    drop: (dragged: { id: number }) => {
      if (dragged.id !== category.id) {
        moveItem(dragged.id, category.id);
      }
    },
    canDrop: (dragged) => {
      // 자기 자신 금지
      if (dragged.id === category.id) return false;

      const draggedCat = localCategories.find((c) => c.id === dragged.id);
      if (!draggedCat) return false;

      // 자식이 있는 루트 카테고리는 다른 카테고리로 이동 불가
      if (
        draggedCat.depth === 0 &&
        draggedCat.children &&
        draggedCat.children.length > 0 &&
        category.id !== 0 // root로 끌어놓는건 허용
      ) {
        return false;
      }

      return true;
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }), }),
  });


  // ✅ ref에 드래그/드롭 연결
  useEffect(() => {
    if (ref.current) {
      dragRef(dropRef(ref.current));
    }
  }, [dragRef, dropRef]);

  const isRoot = depth === 0;
  const width = isRoot ? '950px' : '900px'; // 루트는 800px, 서브는 750px
  const hasChildren = category.children && category.children.length > 0;


  useEffect(() => {
    if (editingCategory?.id === category.id) {
      setEditName(editingCategory.name || '');
      setEditDescription(editingCategory.description || '');
    }
  }, [editingCategory, category.id]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)} // hover 시작
      onMouseLeave={() => setIsHovered(false)} // hover 종료
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
              style={{ transform: isLocalExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              ▶
            </button>
          )}

          {/* 🔧 이름/설명 or 수정폼 */}
          {editingCategory?.id === category.id ? (
            <div className="space-y-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="카테고리 이름"
                className="px-2 py-1 border rounded w-full text-sm"
              />
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="설명 (선택)"
                className="px-2 py-1 border rounded w-full text-sm"
              />
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={onCancelEdit}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  취소
                </button>
                <button
                  onClick={() => onSaveEdit(editName, editDescription)}
                  disabled={!editName.trim()}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="font-medium">{category.name}</span>

              {isHovered && (
                <div className="flex flex-col">
                  <button
                    onClick={() => onChangeOrder?.(category, 'up')}
                    className="text-xs text-gray-400 hover:text-black"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => onChangeOrder?.(category, 'down')}
                    className="text-xs text-gray-400 hover:text-black"
                  >
                    ▼
                  </button>
                </div>
              )}

              {category.description && (
                <span className="text-sm text-gray-400">{category.description}</span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">({category.posts ?? 0} posts)</span>
        </div>

        <CategoryActionMenu
          category={{...category,}}
          onAdd={handleAddChild}
          onEdit={(id) => setEditingCategoryId(id)} // 이걸 직접 넘겨도 되고
          onDelete={() => {
            const hasChildren = category.children && category.children.length > 0;
            const isRoot = depth === 0;

            let confirmMessage = '정말 삭제하시겠습니까?';

            if (isRoot && hasChildren) {
              confirmMessage = '이 카테고리와 모든 하위 항목이 삭제됩니다. 정말 삭제하시겠습니까?';
            }

            if (confirm(confirmMessage)) {
              onDelete(category.id);
            }
          }}
          onMove={() => onMove(category.id)}
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
                depth={depth + 1}
                moveItem={moveItem}
                onAdd={onAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                isExpanded={isExpanded}
                showExpandButton={false}
                onLocalEdit={onLocalEdit}
                onChangeOrder={onChangeOrder}
                localCategories={localCategories}
                editingCategoryId={editingCategoryId}
                setEditingCategoryId={setEditingCategoryId}
                editingCategory={editingCategory}
                setLocalCategories={setLocalCategories}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                setIsDirty={setIsDirty}
              />
            ))}
          {/* 마우스 오버 시에만 화살표 버튼 노출 */}

        </div>
      )}
    </div>
  );
}