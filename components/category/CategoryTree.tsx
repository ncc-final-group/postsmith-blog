'use client';

import React, { useEffect, useState } from 'react';

import { CategoryItem } from "./CategoryItem";
import { DropZone } from "./DropZone";

//api 호출용
export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
  sequence: number;
  parentId: number | null;
  blogId: number;
}

// 프론트 트리 구성용
export interface Category extends CategoryDto {
  children?: Category[];
  depth?: number;
}

// 최대 깊이 상수 추가
const MAX_DEPTH = 2;

interface CategoryTreeProps {
  categories: Category[];
  onMoveItem: (newTree: Category[]) => void;
}

async function fetchNewTree(): Promise<Category[]> {
  const res = await fetch('/api/categories/tree');
  if (!res.ok) throw new Error('카테고리 트리 불러오기 실패');
  return res.json();
}

export function CategoryTree({ categories, onMoveItem }: CategoryTreeProps) {
  const [expandedState, setExpandedState] = useState<{ [key: number]: boolean }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDescription, setNewChildDescription] = useState('');
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    // 중복 체크 및 정리
    const cleanTree = (categories: Category[]): Category[] => {
      return categories.map(cat => ({
        ...cat,
        children: cat.children ? cleanTree(cat.children) : []
      }));
    };
    setLocalCategories(cleanTree(categories));
  }, [categories]);




  //생성
  const handleAddChild = (parentCategory: Category) => {
    alert('handleAddChild 호출됨');
    
    // 깊이 체크
    if ((parentCategory.depth ?? 0) >= MAX_DEPTH - 1) {
      alert('서브 카테고리까지만 생성 가능합니다.');
      return;
    }

    // 부모 카테고리 설정 및 폼 초기화
    const updatedParent = {
      ...parentCategory,
      depth: parentCategory.depth ?? 0
    };
    setParentCategory(updatedParent);
    setNewChildName('');
    setNewChildDescription('');
  };

  const handleSaveChild = () => {
    if (!newChildName.trim() || !parentCategory) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    // 로컬 상태에 새 카테고리 추가
    const newChild: Category = {
      id: Date.now(), // 임시 ID
      name: newChildName,
      description: newChildDescription,
      parentId: parentCategory.id,
      blogId: parentCategory.blogId,
      sequence: (parentCategory.children?.length ?? 0) + 1,
      depth: (parentCategory.depth ?? 0) + 1,
      children: []
    };

    // 부모 카테고리의 children 배열에 추가
    const updatedCategories = localCategories.map(cat => {
      if (cat.id === parentCategory.id) {
        return {
          ...cat,
          children: [...(cat.children || []), newChild]
        };
      }
      return cat;
    });

    // 폼 초기화
    setNewChildName('');
    setNewChildDescription('');
    setParentCategory(null);

    // 변경사항 저장 버튼 활성화
    setIsDirty(true);

    // 트리 업데이트
    setLocalCategories(updatedCategories);
    onMoveItem(updatedCategories);
  };

  const handleCancelAdd = () => {
    setNewChildName('');
    setNewChildDescription('');
    setParentCategory(null);
  };

  const findCategoryById = (id: number, categories: Category[]): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) {
        return cat;
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryById(id, cat.children);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const updateCategoryInTree = (categories: Category[], targetId: number, updater: (cat: Category) => Category): Category[] => {
    return categories.map(cat => {
      if (cat.id === targetId) {
        return updater(cat);
      }
      if (cat.children && cat.children.length > 0) {
        const updatedChildren = updateCategoryInTree(cat.children, targetId, updater);
        return {
          ...cat,
          children: updatedChildren
        };
      }
      return cat;
    });
  };

  // 수정
  const handleEdit = (category: Category) => {
    const targetCategory = findCategoryById(category.id, localCategories);
    if (!targetCategory) {
      return;
    }

    setEditingCategory(targetCategory);
    setEditName(targetCategory.name);
    setEditDescription(targetCategory.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editName.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    const updatedCategories = updateCategoryInTree(localCategories, editingCategory.id, cat => ({
      ...cat,
      name: editName,
      description: editDescription
    }));

    setLocalCategories(updatedCategories);
    setEditingCategory(null);
    setEditName('');
    setEditDescription('');
    setIsDirty(true);
    onMoveItem(updatedCategories);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
    setEditDescription('');
  };

// 깊은 복사 함수
  function moveItem(draggedId: number, newParentId: number | null) {
    // 트리에서 draggedId 제거
    const removeCategory = (categories: Category[]): [Category[], Category | null] => {
      let removed: Category | null = null;

      const result = categories
        .map(cat => {
          if (cat.id === draggedId) {
            removed = cat;
            return null;
          } else if (cat.children) {
            const [newChildren, removedChild] = removeCategory(cat.children);
            if (removedChild) removed = removedChild;
            return { ...cat, children: newChildren };
          }
          return cat;
        })
        .filter(Boolean) as Category[];

      return [result, removed];
    };

    const [categoriesWithoutDragged, draggedCategory] = removeCategory(localCategories);

    if (!draggedCategory) return;

    // parentId 및 depth 재설정
    draggedCategory.parentId = newParentId;
    draggedCategory.depth = newParentId ? 1 : 0;

    // 대상 위치에 삽입
    const insertToParent = (categories: Category[]): Category[] => {
      if (!newParentId) {
        return [...categories, { ...draggedCategory }];
      }

      return categories.map(cat => {
        if (cat.id === newParentId) {
          return {
            ...cat,
            children: [...(cat.children || []), { ...draggedCategory }]
          };
        } else if (cat.children) {
          return { ...cat, children: insertToParent(cat.children) };
        }
        return cat;
      });
    };

    const updated = insertToParent(categoriesWithoutDragged);
    setLocalCategories(updated);
    setIsDirty(true);
    onMoveItem(updated);
  }


  // 전체 펼치기
  const expandAll = () => {
    const newState: { [key: number]: boolean } = {};

    const setExpanded = (cats: Category[]) => {
      cats.forEach(cat => {
        newState[cat.id] = true;  // 모든 카테고리 ID 펼침 true 세팅
        if (cat.children && cat.children.length > 0) {
          setExpanded(cat.children);
        }
      });
    };

    setExpanded(localCategories);
    setExpandedState(newState);
  };

  //전체 닫기
  const collapseAll = () => {
    setExpandedState({});
  };


  const handleDropToRoot = (dragId: number) => moveItem(dragId, null);

  // 변경사항 저장
  const saveChanges = async () => {
    if (!isDirty) return;
    
    try {
      // 모든 카테고리를 평탄화하여 시퀀스 재정렬
      const flattenCategories = (categories: Category[], parentId: number | null = null): Category[] => {
        return categories.reduce((acc: Category[], category, index) => {
          const flatCategory = {
            ...category,
            sequence: index + 1,
            parentId: parentId
          };
          acc.push(flatCategory);
          if (category.children) {
            acc.push(...flattenCategories(category.children, category.id));
          }
          return acc;
        }, []);
      };

      const flatCategories = flattenCategories(localCategories);
      
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flatCategories),
      });
      
      if (res.ok) {
        setIsDirty(false);
        // 트리 새로고침
        onMoveItem(await fetchNewTree());
      }
    } catch (error) {
      // 에러 처리
      alert('카테고리 저장에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = (category: Category) => {
    if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) {
      return;
    }

    const findParentCategory = (id: number, categories: Category[]): Category | null => {
      for (const cat of categories) {
        if (cat.children?.some(child => child.id === id)) {
          return cat;
        }
        if (cat.children) {
          const found = findParentCategory(id, cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    const findLaterSiblings = (category: Category, categories: Category[]): Category[] => {
      const parent = findParentCategory(category.id, categories);
      if (!parent) {
        return categories.filter(cat => cat.sequence > category.sequence);
      }
      return parent.children?.filter(child => child.sequence > category.sequence) || [];
    };

    const targetCategory = findCategoryById(category.id, localCategories);
    if (!targetCategory) return;

    const parentCategory = findParentCategory(category.id, localCategories);
    const children = targetCategory.children || [];
    const laterSiblings = findLaterSiblings(targetCategory, localCategories);

    // 자식 카테고리 승격 및 시퀀스 조정
    const updatedCategories = localCategories.map(cat => {
      if (cat.id === category.id) {
        // 삭제할 카테고리 제거
        return null;
      }

      if (parentCategory && cat.id === parentCategory.id) {
        // 부모 카테고리의 children 배열에서 삭제할 카테고리 제거
        return {
          ...cat,
          children: cat.children?.filter(child => child.id !== category.id)
        };
      }

      // 나중 형제들의 시퀀스 조정
      if (laterSiblings.some(sibling => sibling.id === cat.id)) {
        return {
          ...cat,
          sequence: cat.sequence + (children.length - 1)
        };
      }

      return cat;
    }).filter(Boolean) as Category[];

    // 자식 카테고리들을 부모 카테고리의 위치로 승격
    if (children.length > 0) {
      const parentSequence = targetCategory.sequence;
      const promotedChildren = children.map((child, index) => ({
        ...child,
        parentId: parentCategory?.id || null,
        sequence: parentSequence + index,
        depth: (parentCategory?.depth || 0) + 1
      }));

      // 승격된 자식 카테고리들을 부모 카테고리의 위치에 삽입
      const parentIndex = updatedCategories.findIndex(cat => cat.id === parentCategory?.id);
      if (parentIndex !== -1) {
        // 부모 바로 다음 위치에 자식들을 삽입 (또는 적절한 위치에)
        updatedCategories.splice(parentIndex + 1, 0, ...promotedChildren);
      } else {
        updatedCategories.push(...promotedChildren);
      }
    }

    setLocalCategories(updatedCategories);
    setIsDirty(true);
    onMoveItem(updatedCategories);
  };

  const renderCategory = (category: Category, depth: number) => {
    const isEditing = editingCategory?.id === category.id;
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="space-y-2">
        <div>
          {isEditing ? (
            <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="카테고리 이름"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="설명 (선택사항)"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={!editName.trim()}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <CategoryItem
              category={category}
              depth={depth}
              moveItem={moveItem}
              onAdd={() => handleAddChild(category)}
              onEdit={() => handleEdit(category)}
              onDelete={() => handleDelete(category)}
              onMove={() => {}}
              isExpanded={expandedState[category.id] || false}
              showExpandButton={depth === 0}
            />
          )}

          {/* 하위 카테고리 추가 폼 */}
          {parentCategory && parentCategory.id === category.id && (
            <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="카테고리 이름"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={newChildDescription}
                  onChange={(e) => setNewChildDescription(e.target.value)}
                  placeholder="설명 (선택사항)"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelAdd}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveChild}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={!newChildName.trim()}
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 자식 카테고리들 */}
        {/*{hasChildren && expandedState[category.id] && (
          <div className="mt-2 space-y-1">
            {category.children!
              .sort((a, b) => a.sequence - b.sequence)
              .map((child) => renderCategory(child, depth + 1))}
          </div>
        )}*/}
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 border border-gray-300 bg-white p-4 text-sm text-gray-700">
        <div className="flex justify-between items-center gap-4">
          <p className="whitespace-pre-line">
            카테고리 순서를 변경하고 주제 연결을 설정할 수 있습니다.
            <br />
            드래그 앤 드롭으로 카테고리 순서를 변경할 수 있습니다.
          </p>

          <div className="flex-shrink-0 space-x-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
            >
              전체 펼치기
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              전체 닫기
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto max-h-[490px] p-3 bg-white" style={{
        minWidth: '780px', 
        width: '100%', 
        minHeight: '500px',
        maxWidth: '100%',
        overflowX: 'auto',
        overflowY: 'auto',
        border: '1px solid #ccc', 
        borderRadius: '0.5rem' 
      }}>
        <DropZone onDropToRoot={handleDropToRoot} />
        <div className="space-y-2">
          {localCategories
            .sort((a, b) => a.sequence - b.sequence)
            .map((category) => renderCategory(category, 0))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={saveChanges}
          className={`px-4 py-2 rounded transition-colors duration-200 shadow-md ${
            isDirty 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isDirty}
        >
          변경사항 저장
        </button>
      </div>
    </>
  );
}