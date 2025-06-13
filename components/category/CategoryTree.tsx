'use client';

import React, { useState } from 'react';

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

interface CategoryTreeProps {
  categories: Category[];
  onMoveItem: (newTree: Category[]) => void;
}

export function CategoryTree({ categories, onMoveItem }: CategoryTreeProps) {
  //드래그 이동 관련
  const moveItem = (dragId: number, targetId: number | null) => {
    if (dragId === targetId) return; // 같은 항목 드래그 무시

    const categoryMap = new Map<number, Category>();

    //category[] -> CategoryDto[]
    function flattenCategories(categories: Category[], blogId: number): CategoryDto[] {
      const result: CategoryDto[] = [];

      const traverse = (nodes: Category[], parentId: number | null) => {
        nodes.forEach((node, index) => {
          const { id, name, description } = node;

          result.push({
            id,
            name,
            description,
            parentId,
            sequence: index,
            blogId,
          });

          if (node.children?.length) {
            traverse(node.children, id);
          }
        });
      };

      traverse(categories, null);
      return result;
    }

    const buildMap = (list: Category[]) => {
      list.forEach((cat) => {
        categoryMap.set(cat.id, cat);
        if (cat.children) buildMap(cat.children);
      });
    };
    buildMap(categories);

    const dragged = categoryMap.get(dragId);
    const target = targetId !== null ? categoryMap.get(targetId) : null;

    if (!dragged) return;

    const removeFromTree = (list: Category[]): [Category | null, Category[]] => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].id === dragId) {
          return [list[i], [...list.slice(0, i), ...list.slice(i + 1)]];
        }

        const children = list[i].children;
        if (children && children.length > 0) {
          const [removed, newChildren] = removeFromTree(children);
          if (removed) {
            return [
              removed,
              list.map((item, idx) =>
                idx === i ? { ...item, children: newChildren } : item
              ),
            ];
          }
        }
      }
      return [null, list];
    };

    const [removedItem, newTree] = removeFromTree(categories);
    if (!removedItem) return;

    // ✅ 실제 위치가 변하지 않았으면 무시
    const isNoOp =
      dragged.parentId === (target ? target.id : null);

    if (isNoOp) {
      // 같은 부모 안에서의 순서 변경인지 확인
      const parentList = (target ? target.children : categories) || [];

      const oldIndex = parentList.findIndex((c) => c.id === dragId);
      const newIndex = parentList.findIndex((c) => c.id === (target?.id ?? null));

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return; // 위치가 완전히 같으면 무시
      }

      // ✅ 순서 변경 처리 (동일 부모 안에서만)
      const reordered = [...parentList];
      const movedItem = reordered.splice(oldIndex, 1)[0];
      reordered.splice(newIndex, 0, movedItem);

      // ✅ sequence 재정렬
      const updatedList = reordered.map((item, idx) => ({
        ...item,
        sequence: idx + 1,
      }));

      // 부모에 반영
      const applyToTree = (list: Category[]): Category[] => {
        return list.map((node) => {
          if ((target && node.id === target.id) || (!target && node.parentId === null)) {
            return {
              ...node,
              children: target ? updatedList : undefined,
            };
          }
          if (node.children) {
            return { ...node, children: applyToTree(node.children) };
          }
          return node;
        });
      };

      const finalTree = applyToTree(newTree);
      onMoveItem(finalTree);
      return;
    }

    // ✅ 위치가 변경된 경우: 자식으로 이동 or 루트로 이동
    let updatedTree: Category[];

    if (target) {
      const insert = (list: Category[]): Category[] =>
        list.map((node) => {
          if (node.id === target.id) {
            const children = [...(node.children || [])];
            children.push({ ...removedItem, parentId: target.id });
            const sortedChildren = children
              .map((c, idx) => ({ ...c, sequence: idx + 1 }))
              .sort((a, b) => a.sequence - b.sequence);
            return {
              ...node,
              children: sortedChildren,
            };
          }
          if (node.children) {
            return { ...node, children: insert(node.children) };
          }
          return node;
        });

      updatedTree = insert(newTree);
    } else {
      // 루트로 이동
      const newRoot = [
        ...newTree,
        { ...removedItem, parentId: null }
      ].map((c, idx) => ({ ...c, sequence: idx + 1 }));

      updatedTree = newRoot;
    }

    onMoveItem(updatedTree);
  };

  //오른쪽 상단 펼치기 버튼
  const [expandedMap, setExpandedMap] = useState<{ [id: number]: boolean }>({});

  // 전체 펼치기
  const expandAll = () => {
    const allIds: number[] = [];
    const collectIds = (list: Category[]) => {
      list.forEach((cat) => {
        allIds.push(cat.id);
        if (cat.children) collectIds(cat.children);
      });
    };
    collectIds(categories);
    const newMap = Object.fromEntries(allIds.map((id) => [id, true]));
    setExpandedMap(newMap);
  };

  // 전체 닫기
  const collapseAll = () => {
    setExpandedMap({});
  };

  const handleDropToRoot = (dragId: number) => moveItem(dragId, null);

  return (
    <>
      <div className="mb-4 border border-gray-300 bg-white p-4 text-sm text-gray-700">
        <div className="flex justify-between items-center gap-4">
          {/* 왼쪽 문장 */}
          <p className="whitespace-pre-line">
            카테고리 순서를 변경하고 주제 연결을 설정할 수 있습니다.
            <br />
            드래그 앤 드롭으로 카테고리 순서를 변경할 수 있습니다.
          </p>

          {/* 오른쪽 버튼들 */}
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
        minWidth: '780px', width: '100%', minHeight: '500px',
        border: '1px solid #ccc', borderRadius: '0.5rem' 
      }}>
        <DropZone onDropToRoot={handleDropToRoot} />
        <div className="space-y-2 space-x-2">
          {categories
            .sort((a, b) => a.sequence - b.sequence)
            .map((category) => (
              <CategoryItem key={category.id} category={category} depth={0} moveItem={moveItem} />
            ))}
        </div>
      </div>
    </>
  );
}
