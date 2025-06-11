'use client';

import { DragDropContext, Draggable, DragStart, DragUpdate, Droppable, DropResult } from '@hello-pangea/dnd';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { CategoryMoveModal } from '@app/usermanage/categories/CategoryMoveModal';

export type CategoryApiResponse = {
  id: number;
  name: string;
  description?: string | null;
  categoryId: number | null;
  sequence: number;
  blogId: number;
  children?: CategoryApiResponse[];
  depth?: number; // 깊이 정보 추가
};

export type SubCategory = {
  id: number;
  name: string;
  sequence: number;
  depth: number; // 깊이 정보 추가
  parentId: number; // 부모 카테고리 ID 추가
};

export type Category = {
  id: number;
  name: string;
  sequence: number;
  sub: SubCategory[];
  depth: number; // 깊이 정보 추가
};

const initialCategories: Category[] = [
  {
    id: 1,
    name: '개발',
    sequence: 1,
    sub: [
      { id: 101, name: 'JavaScript', sequence: 1, depth: 1, parentId: 1 },
      { id: 102, name: 'TypeScript', sequence: 2, depth: 1, parentId: 1 },
      { id: 103, name: 'React', sequence: 3, depth: 1, parentId: 1 },
    ],
    depth: 1,
  },
  {
    id: 2,
    name: '일상',
    sequence: 2,
    sub: [
      { id: 201, name: '맛집', sequence: 1, depth: 2, parentId: 2 },
      { id: 202, name: '여행', sequence: 2, depth: 2, parentId: 2 },
    ],
    depth: 2,
  },
  {
    id: 3,
    name: '공지사항',
    sequence: 3,
    sub: [],
    depth: 1,
  }
];

//-----------------------------------------
const API_BASE = 'http://localhost:8080/api/categories';

export async function fetchCategoryTree(blogId: number) {
  const res = await fetch(`${API_BASE}/tree/${blogId}`);
  if (!res.ok) throw new Error('Failed to fetch category tree');
  return res.json();
}

export async function createCategory(dto: { 
  name: string; 
  categoryId?: number;
  blogId: number; 
  type?: string;
  sequence?: number;
}) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json();
}

export async function deleteCategory(id: number) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}

export async function updateCategory(id: number, dto: { 
  name: string; 
  type?: string;
  sequence?: number;
}) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json();
}

export async function reorderCategories(ordered: {
  id: number;
  categoryId: number | null;
  sequence: number;
}[]) {
  const res = await fetch(`${API_BASE}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ordered),
  });
  if (!res.ok) throw new Error('Failed to reorder categories');
}

export async function moveCategory(id: number, newCategoryId: number | null) {
  const url = newCategoryId === null ? 
    `${API_BASE}/${id}/move` : 
    `${API_BASE}/${id}/move?newCategoryId=${newCategoryId}`;
  const res = await fetch(url, { method: 'PUT' });
  if (!res.ok) throw new Error('Failed to move category');
  return res.json();
}
//-----------------------------------------------------------------------------------------

// ======== 이동 타깃 선택 모달 ===========
function getItemKey(type: 'cat' | 'sub', catId: number, subId?: number) {
  return type === 'cat' ? `cat-${catId}` : `sub-${catId}-${subId}`;
}

function convertApiResponseToCategory(apiData: CategoryApiResponse): Category {
  return {
    id: apiData.id,
    name: apiData.name,
    sequence: apiData.sequence,
    sub: (apiData.children ?? []).map((child) => ({
      id: child.id,
      name: child.name,
      sequence: child.sequence,
      depth: child.depth ?? 1,
      parentId: child.categoryId ?? apiData.id
    })),
    depth: apiData.depth ?? 1
  };
}

// 서브카테고리를 메인으로 변환하는 함수 추가
function convertSubToMain(sub: SubCategory): Category {
  return {
    id: sub.id,
    name: sub.name,
    sequence: sub.sequence,
    sub: [],
    depth: sub.depth,
  };
}

// 서브카테고리가 있는 경우 메인 카테고리로 변환
function handleSubToMain(parentId: number, prev: Category[]): Category[] {
  const newCats = [...prev];
  const parentCatIndex = newCats.findIndex(cat => 
    cat.sub.some(sub => sub.id === parentId)
  );

  if (parentCatIndex === -1) return prev;

  const parentCat = newCats[parentCatIndex];
  const subToConvert = parentCat.sub.find(sub => sub.id === parentId);

  if (!subToConvert) return prev;

  // 서브카테고리를 메인으로 변환
  const newMainCat: Category = convertSubToMain(subToConvert);
  newMainCat.sequence = parentCat.sequence + 0.5;

  // 원래 서브카테고리 제거
  parentCat.sub = parentCat.sub.filter(sub => sub.id !== parentId);

  // 새 메인 카테고리 추가
  newCats.splice(parentCatIndex + 1, 0, newMainCat);

  return newCats;
}

// === 드래그 끝났을 때 처리 ===
const CategoryItem = ({ title, isMain = false }: { title: string; isMain?: boolean }) => {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <div className="truncate" title={title}>
        <span className={clsx(isMain ? 'text-lg font-semibold' : 'font-medium')}>{title}</span>
      </div>
    </div>
  );
};

// 서브카테고리를 재귀적으로 찾는 헬퍼 함수
function findSubCategoryById(subs: SubCategory[], id: number): SubCategory | null {
  for (const sub of subs) {
    if (sub.id === id) return sub;
  }
  return null;
}

// 최대 시퀀스 값을 찾는 헬퍼 함수
function getMaxSequence(items: { sequence: number }[]): number {
  return items.length > 0 ? Math.max(...items.map(item => item.sequence)) : 0;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expanded, setExpanded] = useState<Record<number, boolean>>(Object.fromEntries(initialCategories.map((cat) => [cat.id, true])));
  const [loading, setLoading] = useState(true);
  const [mainTitle, setMainTitle] = useState('분류 전체보기');
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<{ catId: number; subId?: number } | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState<{ id: number | null; side: 'left' | 'right' | null }>({ id: null, side: null });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/categories/tree', { cache: 'no-store' });
        if (!res.ok) throw new Error('카테고리를 불러오는 데 실패했습니다');

        const data: CategoryApiResponse[] = await res.json();

        // 변환 적용
        const converted: Category[] = data.map(convertApiResponseToCategory);
        setCategories(converted);
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  //모달 상태 관리
  const [moveModal, setMoveModal] = useState<{
    isOpen: boolean;
    item: null | {
      categoryId: number;
      subId?: number; // optional로 변경
    };
  }>({
    isOpen: false,
    item: null,
  });
  const handleCategoryMove = (targetCategoryId: number, asMainCategory: boolean) => {
    const moveItem = moveModal.item;

    if (!moveItem) return;

    setCategories((prev) => {
      const newCats = [...prev];
      const sourceCatIndex = newCats.findIndex((c) => c.id === moveItem.categoryId);

      if (sourceCatIndex === -1) return prev;

      const sourceCat = newCats[sourceCatIndex];
      const targetCat = targetCategoryId !== 0 ? newCats.find((c) => c.id === targetCategoryId) : null;

      // 메인 카테고리를 서브카테고리로 이동
      if (!moveItem.subId && !asMainCategory && targetCat) {
        // 자기 자신이나 자신의 서브로는 이동 불가
        if (targetCat.id === sourceCat.id || sourceCat.sub.some((sub) => sub.id === targetCat.id)) {
          return prev;
        }

        // 1. 이동할 카테고리의 서브들을 독립 카테고리로 변환
        const independentSubs = sourceCat.sub.map(
          (sub) => ({
            id: sub.id,
            name: sub.name,
            sequence: sub.sequence,
            depth: sub.depth,
            parentId: sub.parentId,
            sub: [] // 빈 서브 배열 추가
          }) as Category
        );

        // 2. 이동할 카테고리를 서브카테고리 형태로 변환
        const newSub: SubCategory = {
          id: sourceCat.id,
          name: sourceCat.name,
          sequence: sourceCat.sequence,
          depth: sourceCat.depth,
          parentId: sourceCat.id,
        };

        // 3. 원본 카테고리 제거
        newCats.splice(sourceCatIndex, 1);

        // 4. 목표 카테고리에 서브 추가
        const targetIndex = newCats.findIndex((c) => c.id === targetCat.id);
        if (targetIndex !== -1) {
          // sub 배열이 없으면 초기화
          targetCat.sub = targetCat.sub || [];

          // 중복 체크 후 추가
          if (!targetCat.sub.some((s) => s.id === newSub.id)) {
            targetCat.sub.push(newSub);
          }

          // 독립된 서브카테고리들 추가
          newCats.splice(targetIndex + 1, 0, ...independentSubs);
        }

        return newCats;
      }

      if (moveItem.subId && asMainCategory) {
        // 이동할 서브카테고리 찾기
        const subToMove = sourceCat.sub.find((s) => s.id === moveItem.subId);
        if (!subToMove) return prev;

        // 새로운 메인 카테고리 생성
        const newMainCategory: Category = {
          id: subToMove.id,
          name: subToMove.name,
          sequence: subToMove.sequence,
          sub: [],
          depth: subToMove.depth,
        };

        // 원본에서 서브카테고리 제거
        sourceCat.sub = sourceCat.sub.filter((s) => s.id !== moveItem.subId);

        // 새 메인 카테고리 추가
        const insertIndex = sourceCatIndex + 1;
        newCats.splice(insertIndex, 0, newMainCategory);

        return newCats;
      }

      // 3. 서브카테고리를 다른 메인의 서브로 이동
      if (moveItem.subId && !asMainCategory && targetCat) {
        // 자기 자신의 카테고리로는 이동 불가
        if (targetCat.id === sourceCat.id) return prev;

        // 이동할 서브카테고리 찾기
        const subToMove = sourceCat.sub.find((s) => s.id === moveItem.subId);
        if (!subToMove) return prev;

        // 중복 체크
        if (targetCat.sub.some((s) => s.id === subToMove.id)) return prev;

        // 원본에서 서브카테고리 제거
        sourceCat.sub = sourceCat.sub.filter((s) => s.id !== moveItem.subId);

        // 목표 카테고리에 서브 추가
        targetCat.sub = targetCat.sub || [];
        targetCat.sub.push({
          id: subToMove.id,
          name: subToMove.name,
          sequence: subToMove.sequence,
          depth: subToMove.depth,
          parentId: subToMove.parentId,
        });

        return newCats;
      }

      return prev;
    });

    // 이동 모달 닫기
    setMoveModal({ isOpen: false, item: null });
  };

  // 전체 펼침/접힘
  const handleExpandAll = (expand: boolean) => {
    setExpanded(Object.fromEntries(categories.map((cat) => [cat.id, expand])));
  };

  const toggleSubs = (catId: number) => {
    setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  function handleEdit(catId: number, subId?: number) {
    const category = categories.find((cat) => cat.id === catId);
    if (!category) return;

    if (typeof subId === 'number') {
      const sub = category.sub.find((s) => s.id === subId);
      if (!sub) return;
      setEditingName(sub.name);
    } else {
      setEditingName(category.name);
    }
    setEditingId({ catId, subId });
  }

  function handleDelete(catId: number, subId?: number) {
    // 서브카테고리 삭제
    if (typeof subId === 'number') {
      // 삭제하려는 서브카테고리가 부모인지 확인
      const hasChildren = categories.some(cat => 
        cat.sub.some(sub => sub.parentId === subId)
      );

      if (hasChildren) {
        alert('하위 카테고리가 있는 카테고리는 삭제할 수 없습니다.\n하위 카테고리를 먼저 삭제해주세요.');
        return;
      }

      if (!window.confirm('정말 삭제하시겠어요?')) return;
      
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === catId) {
            return { ...cat, sub: cat.sub.filter((sub) => sub.id !== subId) };
          }
          return cat;
        }),
      );
      return;
    }

    // 메인 카테고리 삭제
    const category = categories.find((cat) => cat.id === catId);
    if (category && category.sub.length > 0) {
      alert('서브 카테고리가 있으면 메인 카테고리를 삭제할 수 없습니다.\n서브 카테고리를 삭제하거나 이동한 후 삭제해 주십시오.');
      return;
    }

    if (!window.confirm('정말 삭제하시겠어요?')) return;
    setCategories((prev) => prev.filter((cat) => cat.id !== catId));
  }

  function handleSetting(catId: number, subId?: number) {
    alert('설정에 카테고리 설정이랑 설명 넣어야하는데, 이건 이야기 해보죠');
    /*if (typeof subId === 'number') {
      alert(`서브카테고리 설정: ${catId} / ${subId}`);
    } else {
      alert(`카테고리 설정: ${catId}`);
    }*/
  }

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;

    const maxSequence = Math.max(0, ...categories.map(cat => cat.sequence));
    const newCategory: Category = {
      id: Date.now(),
      name: newCategoryName.trim(),
      sequence: maxSequence + 1,
      sub: [],
      depth: 1,
    };

    setCategories((prev) => [newCategory, ...prev]);
    setIsAdding(false);
    setNewCategoryName('');
  }

  function generateUniqueId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  function handleSaveEdit() {
    if (!editingId || !editingName.trim()) return;

    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === editingId.catId) {
          if (editingId.subId !== undefined) {
            return {
              ...cat,
              sub: cat.sub.map((sub) => {
                if (sub.id === editingId.subId) {
                  return {
                    ...sub,
                    name: editingName.trim()
                  };
                }
                return sub;
              }),
            };
          }
          return { ...cat, name: editingName.trim() };
        }
        return cat;
      }),
    );

    setEditingId(null);
    setEditingName('');
  }

  // 드래그 시작 핸들러
  const handleDragStart = (start: DragStart) => {
    const draggedItem = categories[start.source.index];
    if (draggedItem) {
      document.body.setAttribute('data-dragging-type', 'category');
    }
  };

  // 드래그 업데이트 핸들러
  const handleDragUpdate = (update: DragUpdate) => {
    if (!update.destination) {
      setIsDraggingOver({ id: null, side: null });
      return;
    }

    const draggedItem = categories[update.source.index];
    const targetItem = categories[update.destination.index];

    if (!targetItem) {
      setIsDraggingOver({ id: null, side: null });
      return;
    }

    const draggedElement = document.querySelector(`[data-rbd-draggable-id="${update.draggableId}"]`);
    const targetElement = document.querySelector(`[data-rbd-draggable-id="cat-${targetItem.id}"]`);

    if (!draggedElement || !targetElement) {
      setIsDraggingOver({ id: null, side: null });
      return;
    }

    const dragRect = draggedElement.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const isRightSide = dragRect.left + dragRect.width / 2 > targetRect.left + targetRect.width / 2;

    setIsDraggingOver({
      id: targetItem.id,
      side: isRightSide ? 'right' : 'left',
    });
  };

  // 드래그 종료 핸들러
  const handleDragEnd = (result: DropResult) => {
    setIsDraggingOver({ id: null, side: null });
    document.body.removeAttribute('data-dragging-type');

    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    setCategories(prev => {
      const newCategories = Array.from(prev);
      const [removed] = newCategories.splice(sourceIndex, 1);
      newCategories.splice(destinationIndex, 0, removed);
      return newCategories;
    });
  };

  // 현재 카테고리 트리의 최대 깊이 계산
  const getMaxDepth = (categories: Category[]) => {
    let maxDepth = 1;
    
    const calculateDepth = (subs: SubCategory[], currentDepth: number) => {
      for (const sub of subs) {
        maxDepth = Math.max(maxDepth, currentDepth);
        const childSubs = categories.find(cat => cat.id === sub.parentId)?.sub.filter(s => s.parentId === sub.id) || [];
        calculateDepth(childSubs, currentDepth + 1);
      }
    };

    for (const cat of categories) {
      calculateDepth(cat.sub, 2); // 메인 카테고리는 1단계, 서브카테고리는 2단계부터 시작
    }

    return maxDepth;
  };

  const maxDepth = getMaxDepth(categories);

  // handleAddSub를 컴포넌트 내부에 선언
  function handleAddSub(parentId: number) {
    setCategories((prev) => {
      const newCats = structuredClone(prev);
      let foundParentCat: Category | null = null;
      let foundParentSub: SubCategory | null = null;
      foundParentCat = newCats.find(cat => cat.id === parentId) || null;
      if (!foundParentCat) {
        for (const cat of newCats) {
          const foundSub = findSubCategoryById(cat.sub, parentId);
          if (foundSub) {
            foundParentSub = foundSub;
            foundParentCat = cat;
            break;
          }
        }
      }
      if (!foundParentCat) return prev;
      // parentId가 같은 형제들만 대상으로 sequence 계산
      const siblings = foundParentCat.sub.filter(s => s.parentId === parentId);
      const newSub: SubCategory = {
        id: generateUniqueId(),
        name: '새 서브카테고리',
        sequence: getMaxSequence(siblings) + 1,
        depth: foundParentSub ? foundParentSub.depth + 1 : 2,
        parentId: parentId
      };
      foundParentCat.sub.push(newSub);
      foundParentCat.sub.sort((a, b) => a.sequence - b.sequence);
      return newCats;
    });
  }

  // SubCategoryItem 컴포넌트도 내부에 선언
  const SubCategoryItem = ({ 
    sub, 
    cat, 
    parentDepth = 1,
    editingId,
    editingName,
    setEditingName,
    handleSaveEdit,
    setEditingId,
    handleEdit,
    handleDelete,
    handleSetting,
    handleAddSub,
    setMoveModal,
    provided
  }: { 
    sub: SubCategory; 
    cat: Category; 
    parentDepth?: number;
    editingId: { catId: number; subId?: number } | null;
    editingName: string;
    setEditingName: (name: string) => void;
    handleSaveEdit: () => void;
    setEditingId: (id: { catId: number; subId?: number } | null) => void;
    handleEdit: (catId: number, subId?: number) => void;
    handleDelete: (catId: number, subId?: number) => void;
    handleSetting: (catId: number, subId?: number) => void;
    handleAddSub: (parentId: number) => void;
    setMoveModal: (modal: { isOpen: boolean; item: { categoryId: number; subId?: number } | null }) => void;
    provided: any;
  }) => {
    const childSubs = cat.sub.filter(s => s.parentId === sub.id);


    return (
      <>
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ marginLeft: 8 }}
          className={clsx(
            'group rounded border-l-4 border-gray-300 bg-gray-50 min-w-[450px]',
            'hover:bg-gray-100/50',
            'px-4 py-2.5',
            'w-full'
          )}
        >
          <div className="max-w-[800px] flex items-center justify-between gap-2 pr-6">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="mr-4 cursor-move text-gray-400 select-none" {...provided.dragHandleProps}>
                ☰
              </span>
              {editingId?.catId === cat.id && editingId.subId === sub.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded border px-3 py-1.5 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="rounded border bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                    disabled={!editingName.trim()}
                  >
                    완료
                  </button>
                  <button onClick={() => setEditingId(null)} className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                    취소
                  </button>
                </div>
              ) : (
                <CategoryItem title={sub.name} />
              )}
            </div>
            {!editingId && (
              <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0">
                <button
                  className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddSub(sub.id);
                  }}
                >
                  추가
                </button>
                <button
                  className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                  onClick={(e) => handleEdit(cat.id, sub.id)}
                >
                  수정
                </button>
                <button
                  className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-red-500 hover:bg-gray-50"
                  onClick={(e) => handleDelete(cat.id, sub.id)}
                >
                  삭제
                </button>
                <button
                  className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                  onClick={(e) => handleSetting(cat.id, sub.id)}
                >
                  설정
                </button>
                <button
                  className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                  onClick={(e) =>
                    setMoveModal({
                      isOpen: true,
                      item: {
                        categoryId: cat.id,
                        subId: sub.id,
                      },
                    })
                  }
                >
                  이동
                </button>
              </div>
            )}
          </div>
        </li>
        {/* 자식 서브카테고리 렌더링 */}
        {childSubs.length > 0 && (
          <ul className="space-y-2 ml-8">
            {childSubs.map(childSub => (
              <Draggable
                key={childSub.id}
                draggableId={`sub-${childSub.id}`}
                index={childSub.sequence}
              >
                {(provided) => (
                  <SubCategoryItem
                    key={childSub.id}
                    sub={childSub}
                    cat={cat}
                    parentDepth={parentDepth + 1}
                    editingId={editingId}
                    editingName={editingName}
                    setEditingName={setEditingName}
                    handleSaveEdit={handleSaveEdit}
                    setEditingId={setEditingId}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleSetting={handleSetting}
                    handleAddSub={handleAddSub}
                    setMoveModal={setMoveModal}
                    provided={provided}
                  />
                )}
              </Draggable>
            ))}
          </ul>
        )}
      </>
    );
  };

  // === 렌더 ===
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">{mainTitle}</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className={clsx(
              'flex items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium ' +
              'text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
            )}
            onClick={() => setIsAdding(true)}
          >
            <span>카테고리 추가</span>
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="mx-auto">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="relative">
              <div className={clsx(
                'min-h-[300px] overflow-y-auto overflow-x-auto',
                'relative rounded-md border border-gray-300 bg-white p-3'
              )}>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="categories" type="category">
                    {(provided) => (
                      <>
                        {/* 전체 펼치기/닫기 버튼 */}
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-500">{categories.length}/100</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded-md border border-gray-300 bg-white py-1.5 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                onClick={() => handleExpandAll(true)}
                              >
                                전체 펼치기
                              </button>
                              <button
                                type="button"
                                className="rounded-md border border-gray-300 bg-white py-1.5 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                onClick={() => handleExpandAll(false)}
                              >
                                전체 닫기
                              </button>
                            </div>
                          </div>
                        </div>
                        <hr className="my-2" />
                        {/* 카테고리(분류 전체보기) 타이틀/버튼 */}
                        <div className="relative w-[780px]">
                          {/* 상단 고정 타이틀/버튼 */}
                          <div className="sticky top-0 z-10 bg-white group mb-4 flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3 shadow-sm">
                            <span className="text-lg font-bold">{mainTitle}</span>
                            <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <button onClick={() => setIsAdding(true)} className="cursor-pointer rounded border border-gray-300
                              bg-white px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-50">
                                추가
                              </button>
                              <button
                                onClick={() => {
                                  const newTitle = prompt('제목을 입력하세요', mainTitle);
                                  if (newTitle?.trim()) setMainTitle(newTitle);
                                }}
                                className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 hover:bg-gray-50"
                              >
                                수정
                              </button>
                            </div>
                          </div>
                          {/* 카테고리 목록 스크롤 영역 */}
                          <div className="overflow-auto max-h-[490px]" style={{minWidth: '780px',width: '100%'}}>
                            <ul
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-4"
                            >
                              {categories.length === 0 ? (
                                <li className="py-12 text-center text-gray-500">
                                  생성된 카테고리가 없습니다.<br />
                                  <span className="leading-relaxed">카테고리를 생성해주세요.</span>
                                </li>
                              ) : (
                                categories.map((cat, idx) => (
                                  <Draggable
                                    key={cat.id}
                                    draggableId={`cat-${cat.id}`}
                                    index={idx}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={clsx('relative')}
                                      >
                                        <div className="group rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
                                          <div className="flex items-center gap-2">
                                            <span className="mr-4 cursor-move text-gray-400 select-none" {...provided.dragHandleProps}>
                                              ☰
                                            </span>
                                            {/* 메인 카테고리 이름 표시 */}
                                            <CategoryItem title={cat.name} isMain />
                                            {/* 펼침/접힘 버튼 */}
                                            {cat.sub.some(sub => sub.parentId === cat.id) ? (
                                              <button
                                                onClick={(e) => toggleSubs(cat.id)}
                                                className="flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                                type="button"
                                                aria-label={expanded[cat.id] ? '접기' : '펼치기'}
                                              >
                                                {expanded[cat.id] ? '▼' : '▶'}
                                              </button>
                                            ) : (
                                              <span className="w-6" />
                                            )}
                                          </div>
                                        </div>
                                        {/* 서브카테고리 재귀 렌더링 */}
                                        {expanded[cat.id] && cat.sub.some(sub => sub.parentId === cat.id) && (
                                          <ul className="ml-8 space-y-2">
                                            {cat.sub
                                              .filter(sub => sub.parentId === cat.id)
                                              .map((sub) => (
                                                <Draggable
                                                  key={sub.id}
                                                  draggableId={`sub-${sub.id}`}
                                                  index={sub.sequence}
                                                >
                                                  {(provided) => (
                                                    <SubCategoryItem
                                                      key={sub.id}
                                                      sub={sub}
                                                      cat={cat}
                                                      parentDepth={1}
                                                      editingId={editingId}
                                                      editingName={editingName}
                                                      setEditingName={setEditingName}
                                                      handleSaveEdit={handleSaveEdit}
                                                      setEditingId={setEditingId}
                                                      handleEdit={handleEdit}
                                                      handleDelete={handleDelete}
                                                      handleSetting={handleSetting}
                                                      handleAddSub={handleAddSub}
                                                      setMoveModal={setMoveModal}
                                                      provided={provided}
                                                    />
                                                  )}
                                                </Draggable>
                                              ))}
                                          </ul>
                                        )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </ul>
                          </div>
                        </div>
                      </>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          </div>
        </div>
      </div>

      {moveModal.isOpen && moveModal.item && (
        <CategoryMoveModal
          isOpen={moveModal.isOpen}
          onClose={() => setMoveModal({ isOpen: false, item: null })}
          categories={categories}
          selectedItem={{
            categoryId: moveModal.item.categoryId,
            subId: moveModal.item.subId ?? 0
          }}
          onMove={handleCategoryMove}
        />
      )}
    </div>
  );
}
