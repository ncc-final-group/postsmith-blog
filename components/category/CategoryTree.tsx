'use client';

import React, { useCallback, useEffect, useState } from 'react';

import { CategoryItem } from './CategoryItem';
import { DropZone } from './DropZone';

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
  posts?: number;
}

// 최대 깊이 상수 추가
const MAX_DEPTH = 2;

interface CategoryTreeProps {
  categories: Category[];
  onMoveItem: (newTree: Category[]) => void;
  blogId: number;
}

export function CategoryTree({ categories, onMoveItem, blogId }: CategoryTreeProps) {
  const [expandedState, setExpandedState] = useState<{ [key: number]: boolean }>({});
  const [isDirty, setIsDirty] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [newChildName, setNewChildName] = useState('');
  const [newChildDescription, setNewChildDescription] = useState('');
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [originalCategories, setOriginalCategories] = useState<Category[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  let [tempId, setTempId] = useState(-1);

  function onEditClick(categoryId: number) {
    setEditingCategoryId(categoryId);
  }

  const cleanTree = (categories: Category[]): Category[] => {
    return categories.map((cat) => ({
      ...cat,
      children: cat.children ? cleanTree(cat.children) : [],
    }));
  };

  useEffect(() => {
    const cleaned = cleanTree(categories);

    setLocalCategories(cleaned);

    // ✅ 최초 1번만 originalCategories 저장
    if (originalCategories.length === 0) {
      setOriginalCategories(JSON.parse(JSON.stringify(cleaned)));
    }
  }, [categories]);

  useEffect(() => {
    if (editingCategoryId) {
      const findCategory = (categories: Category[]): Category | null => {
        for (const cat of categories) {
          if (cat.id === editingCategoryId) return cat;
          if (cat.children) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };

      setEditingCategory(findCategory(localCategories));
    } else {
      setEditingCategory(null);
    }
  }, [editingCategoryId, localCategories]);

  const handleUndoChanges = () => {
    if (!isDirty) return;

    if (confirm('변경사항을 되돌리시겠습니까?')) {
      setLocalCategories(originalCategories);
      setIsDirty(false);
      onMoveItem(originalCategories);
    }
  };

  function setDepth(categories: Category[], depth = 0): Category[] {
    return categories.map((cat) => ({
      ...cat,
      depth,
      children: cat.children ? setDepth(cat.children, depth + 1) : [],
    }));
  }

  //생성
  const handleAddChild = (parentCategory: Category) => {
    // 깊이 체크
    if ((parentCategory.depth ?? 0) >= MAX_DEPTH - 1) {
      alert('서브 카테고리까지만 생성 가능합니다.');
      return;
    }

    // 부모 카테고리 설정 및 폼 초기화
    const updatedParent = {
      ...parentCategory,
      depth: parentCategory.depth ?? 0,
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

    const newId = tempId;
    setTempId((prev) => prev - 1);

    // 로컬 상태에 새 카테고리 추가
    const newChild: Category = {
      id: newId,
      name: newChildName,
      description: newChildDescription,
      blogId: blogId,
      parentId: parentCategory.id,
      sequence: (parentCategory.children?.length ?? 0) + 1,
      depth: (parentCategory.depth ?? 0) + 1,
      children: [],
    };

    // 부모 카테고리의 children 배열에 추가
    const updatedCategories = localCategories.map((cat) => {
      if (cat.id === parentCategory.id) {
        return {
          ...cat,
          children: [...(cat.children || []), newChild],
        };
      }
      return cat;
    });

    // 상태 업데이트: 원래 상태로 리셋하는 게 아니라 새 상태를 반영해야 함
    setLocalCategories(updatedCategories);

    // 폼 초기화
    setNewChildName('');
    setNewChildDescription('');
    setParentCategory(null);

    // 변경사항 저장 버튼 활성화
    setIsDirty(true);

    onMoveItem(updatedCategories);
  };

  const handleCancelAdd = () => {
    setNewChildName('');
    setNewChildDescription('');
    setParentCategory(null);
  };

  // 재귀 탐색 함수 자체도 로그 찍어보기 (선택사항)
  function findCategoryByIdDeep(categories: Category[] | undefined, id: number): Category | undefined {
    if (!categories || !Array.isArray(categories)) {
      return undefined;
    }

    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryByIdDeep(cat.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  const handleEdit = (id: number) => {
    const categoryToEdit = findCategoryByIdDeep(categories, id);

    if (!categoryToEdit) {
      return;
    }

    setEditName(categoryToEdit.name);
    setEditDescription(categoryToEdit.description ?? '');
    setEditingCategoryId(id);
  };

  const updateCategoryInTree = (categories: Category[], targetId: number, updater: (cat: Category) => Partial<Category>): Category[] => {
    return categories.map((cat) => {
      if (cat.id === targetId) {
        return {
          ...cat,
          ...updater(cat), // 자식(children)은 건드리지 않고, 변경할 필드만 덮어씀
        };
      }
      if (cat.children && cat.children.length > 0) {
        return {
          ...cat,
          children: updateCategoryInTree(cat.children, targetId, updater),
        };
      }
      return cat;
    });
  };

  const updateParentChildren = (categories: Category[], parentId: number, newChildren: Category[]): Category[] => {
    return categories.map((cat) => {
      if (cat.id === parentId) {
        return { ...cat, children: newChildren };
      }
      if (cat.children && cat.children.length > 0) {
        return { ...cat, children: updateParentChildren(cat.children, parentId, newChildren) };
      }
      return cat;
    });
  };

  /*// 수정
  const handleEdit = (category: Category) => {
    const targetCategory = findCategoryById(category.id, localCategories);
    if (!targetCategory) {
      return;
    }

    setEditingCategory(targetCategory);
    setEditName(targetCategory.name);
    setEditDescription(targetCategory.description || '');
  };*/

  const handleSaveEdit = (name: string, description: string) => {
    if (!editingCategory) return;

    const updateCategoryById = (categories: Category[]): Category[] => {
      return categories.map((cat) => {
        if (cat.id === editingCategory.id) {
          return { ...cat, name, description };
        } else if (cat.children) {
          return { ...cat, children: updateCategoryById(cat.children) };
        }
        return cat;
      });
    };

    const updated = updateCategoryById(localCategories);
    setLocalCategories(updated);
    setIsDirty(true);
    setEditingCategoryId(null);
    setEditingCategory(null);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingCategory(null);
  };

  const moveCategoryOrder = useCallback(
    (targetCategory: Category, direction: 'up' | 'down') => {
      const reorder = (list: Category[], id: number): Category[] => {
        const idx = list.findIndex((c) => c.id === id);
        if (idx === -1) return list;

        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= list.length) return list;

        const newList = [...list];
        [newList[idx], newList[swapWith]] = [newList[swapWith], newList[idx]];

        return newList.map((cat, i) => ({
          ...cat,
          sequence: i + 1,
        }));
      };

      let updatedCategories: Category[];

      if (targetCategory.depth === 0) {
        const rootList = localCategories.slice().sort((a, b) => a.sequence - b.sequence);
        const reordered = reorder(rootList, targetCategory.id);
        updatedCategories = reordered;
      } else {
        updatedCategories = updateCategoryInTree(localCategories, targetCategory.parentId!, (parent) => {
          const sortedChildren = [...(parent.children || [])].sort((a, b) => a.sequence - b.sequence);
          const reorderedChildren = reorder(sortedChildren, targetCategory.id);
          return { children: reorderedChildren };
        });
      }

      setLocalCategories(updatedCategories);
      setIsDirty(true);
    },
    [localCategories],
  );

  const sortCategoriesRecursively = (categories: Category[]): Category[] => {
    return categories
      .slice()
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      .map((cat) => ({
        ...cat,
        children: cat.children ? sortCategoriesRecursively(cat.children) : [],
      }));
  };

  // 깊은 복사 함수
  function moveItem(draggedId: number, newParentId: number | null) {
    // 트리에서 draggedId 제거

    const initialDraggedCategory = localCategories.find((c) => c.id === draggedId);
    if (initialDraggedCategory && initialDraggedCategory.depth === 0 && initialDraggedCategory.children && initialDraggedCategory.children.length > 0 && newParentId !== null) {
      alert('자식 카테고리가 있는 루트 카테고리는 다른 카테고리로 이동할 수 없습니다. 먼저 자식 카테고리를 제거해주세요.');
      return;
    }

    const removeCategory = (categories: Category[]): [Category[], Category | null] => {
      let removed: Category | null = null;

      const result = categories
        .map((cat) => {
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

      return categories.map((cat) => {
        if (cat.id === newParentId) {
          return {
            ...cat,
            children: [...(cat.children || []), { ...draggedCategory }],
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
      cats.forEach((cat) => {
        newState[cat.id] = true; // 모든 카테고리 ID 펼침 true 세팅
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
            parentId, // category 안의 parentId를 덮어씀
            sequence: index + 1,
            blog: 1,
            children: undefined,
          };

          acc.push(flatCategory);

          if (category.children) {
            acc.push(...flattenCategories(category.children, category.id));
          }
          return acc;
        }, []);
      };

      const sortedCategories = sortCategoriesRecursively(localCategories);

      const flatCategories = flattenCategories(sortedCategories).map((c) => ({
        ...c,
        blogId: 1, // 또는 dynamicBlogId
      }));

      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flatCategories),
      });

      const fetchNewTree = async (): Promise<Category[]> => {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/categories/tree');
        if (!res.ok) throw new Error('Failed to fetch categories');
        return await res.json();
      };

      const newPostCounts = async (): Promise<Record<number, number>> => {
        const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/categories/posts/counts?blogId=1`);
        return await res.json();
      };

      if (res.ok) {
        setIsDirty(false);
        const newTree = await fetchNewTree();
        const cleanedTree = setDepth(newTree); // depth 재설정
        const postCounts = await newPostCounts();

        const updatedTreeWithCounts = cleanedTree.map((cat) => ({
          ...cat,
          posts: postCounts[cat.id] ?? 0,
        }));

        // ✅ 이걸로 덮어쓰기
        setLocalCategories(updatedTreeWithCounts);
        setOriginalCategories(JSON.parse(JSON.stringify(updatedTreeWithCounts)));
        onMoveItem(updatedTreeWithCounts);
      }
    } catch (error) {
      alert('카테고리 저장에 실패했습니다.');
    }
  };

  const handleAddRootCategory = () => {
    const newId = tempId;
    setTempId(tempId - 1);

    const newCategory: Category = {
      id: newId,
      blogId: blogId != null ? blogId : 1, // 이게 더 안전
      name: '',
      description: '',
      parentId: null,
      sequence: localCategories.length + 1,
      children: [],
      depth: 0,
      posts: 0,
    };

    setLocalCategories((prev) => [...prev, newCategory]);
    setEditingCategoryId(newId);
    setEditingCategory(newCategory);
    setIsDirty(true);
  };

  // 삭제
  const handleDelete = (id: number) => {
    // 삭제할 ID를 포함한 모든 하위 자식 ID 수집
    const collectAllIdsToDelete = (cat: Category): number[] => {
      const ids = [cat.id];
      if (cat.children) {
        cat.children.forEach((child) => {
          ids.push(...collectAllIdsToDelete(child));
        });
      }
      return ids;
    };
    const findCategoryById = (cats: Category[], id: number): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategoryById(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };

    const categoryToDelete = findCategoryById(localCategories, id);
    if (!categoryToDelete) return;

    const idsToDelete = collectAllIdsToDelete(categoryToDelete);

    const deleteRecursively = (cats: Category[]): Category[] => {
      return cats
        .filter((cat) => !idsToDelete.includes(cat.id))
        .map((cat) => ({
          ...cat,
          children: cat.children ? deleteRecursively(cat.children) : [],
        }));
    };

    const updated = deleteRecursively(localCategories);
    setLocalCategories(updated);
    setIsDirty(true);
  };

  useEffect(() => {
    const fetchPostCounts = async () => {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/categories/posts/counts?blogId=${blogId}`);
      const counts: Record<number, number> = await res.json();

      const mergeCounts = (categories: Category[]): Category[] => {
        return categories.map((category) => ({
          ...category,
          posts: counts[category.id] ?? 0,
          children: category.children ? mergeCounts(category.children) : [],
        }));
      };

      const newCategoriesWithPosts = mergeCounts(localCategories);
      setLocalCategories(newCategoriesWithPosts);
    };

    if (localCategories.length > 0) {
      fetchPostCounts();
    }
  }, [blogId]);

  const renderCategory = (category: Category, depth: number) => {
    const isEditing = editingCategory?.id === category.id;

    return (
      <div key={category.id} className="space-y-2 px-14">
        <div className="flex flex-col space-y-2">
          {isEditing ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="카테고리 이름"
                  className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="설명 (선택사항)"
                  className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={handleCancelEdit} className="rounded px-3 py-1 text-gray-600 hover:bg-gray-200">
                    취소
                  </button>
                  <button
                    onClick={() => handleSaveEdit(editName, editDescription)}
                    className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
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
              onEdit={handleEdit} // 상위 컴포넌트에 구현된 함수 넘기기
              onDelete={handleDelete}
              onMove={() => {}}
              isExpanded={expandedState[category.id] || false}
              showExpandButton={depth === 0}
              onChangeOrder={moveCategoryOrder}
              localCategories={localCategories}
              editingCategoryId={editingCategoryId}
              setEditingCategoryId={setEditingCategoryId}
              editingCategory={editingCategory}
              onLocalEdit={onEditClick}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              setLocalCategories={setLocalCategories}
              setIsDirty={setIsDirty}
            />
          )}

          {/* 하위 카테고리 추가 폼 */}
          {parentCategory && parentCategory.id === category.id && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="카테고리 이름"
                  className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newChildDescription}
                  onChange={(e) => setNewChildDescription(e.target.value)}
                  placeholder="설명 (선택사항)"
                  className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-end space-x-2">
                  <button onClick={handleCancelAdd} className="rounded px-3 py-1 text-gray-600 hover:bg-gray-200">
                    취소
                  </button>
                  <button onClick={handleSaveChild} className="rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600" disabled={!newChildName.trim()}>
                    저장
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <button onClick={handleAddRootCategory} className="mb-4 rounded bg-green-500 px-4 py-2 text-white shadow hover:bg-green-600">
        + 새 루트 카테고리
      </button>
      <div className="mb-4 border border-gray-300 bg-white p-4 text-sm text-gray-700">
        <div className="flex items-center justify-between gap-4">
          <p className="whitespace-pre-line">
            카테고리 순서를 변경하고 주제 연결을 설정할 수 있습니다.
            <br />
            드래그 앤 드롭으로 카테고리 순서를 변경할 수 있습니다.
          </p>

          <div className="flex-shrink-0 space-x-2">
            <button onClick={expandAll} className="rounded bg-blue-100 px-3 py-1 text-blue-800 hover:bg-blue-200">
              전체 펼치기
            </button>
            <button onClick={collapseAll} className="rounded bg-gray-100 px-3 py-1 text-gray-800 hover:bg-gray-200">
              전체 닫기
            </button>
          </div>
        </div>
      </div>

      <div
        className="max-h-[490px] overflow-auto bg-white p-3"
        style={{
          minWidth: '780px',
          width: '100%',
          minHeight: '500px',
          maxWidth: '100%',
          overflowX: 'auto',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
        }}
      >
        <DropZone onDropToRoot={handleDropToRoot} />
        <div className="space-y-2">
          {localCategories
            .filter((category) => category.depth === 0)
            .sort((a, b) => a.sequence - b.sequence) // 🔽 추가
            .map((category) => renderCategory(category, 0))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleUndoChanges}
          className={`mr-2 rounded px-7 py-1 transition-colors duration-200 ${isDirty ? 'text-gray-600 hover:bg-gray-200' : 'cursor-not-allowed text-gray-400'}`}
          disabled={!isDirty}
        >
          변경사항 되돌리기
        </button>
        <button
          onClick={saveChanges}
          className={`rounded px-4 py-2 shadow-md transition-colors duration-200 ${
            isDirty ? 'bg-blue-500 text-white hover:bg-blue-600' : 'cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
          disabled={!isDirty}
        >
          변경사항 저장
        </button>
      </div>
    </>
  );
}
