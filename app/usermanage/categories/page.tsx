'use client';

import { Category, CategoryTree } from '@components/category/CategoryTree';

import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function removeCategory(tree: Category[], id: number): [Category | null, Category[]] {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      const removed = tree[i];
      return [removed, [...tree.slice(0, i), ...tree.slice(i + 1)]];
    }
    const [removed, newChildren] = removeCategory(tree[i].children || [], id);
    if (removed) {
      tree[i].children = newChildren;
      return [removed, [...tree]];
    }
  }
  return [null, tree];
}

function insertCategory(tree: Category[], targetId: number | null, item: Category): Category[] {
  if(targetId == null){
    item.parentId = null;
    return [...tree, item];
  }

  return tree.map((node) => {
    if (node.id === targetId) {
      const newChildren = [...(node.children || []), item];

      // sequence 다시 할당 -> 1부터 시작
      const sortedChildren = newChildren
        .map((child, idx) => ({ ...child, sequence: idx + 1 }));

      return { ...node, children: sortedChildren };
    }
    return { ...node, children: insertCategory(node.children || [], targetId, item) };
  });
}

export default function CategoriesPage() {

  const [treeData, setTreeData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8080/api/categories/tree'); // 백엔드 카테고리 API 경로
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        const data = await res.json();
        setTreeData(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  if (loading) return <div>로딩중...</div>;
  if (error) return <div>에러: {error}</div>;

  // 부모 아이디 얻기
  function getParentIdOf(tree: Category[], targetId: number, parentId: number | null = null): number | null {
    for (const node of tree) {
      if (node.id === targetId) {
        return parentId;
      }
      const found = getParentIdOf(node.children || [], targetId, node.id);
      if (found !== null) return found;
    }
    return null;
  }
  // reorder
  function reorderCategoryWithinParent(
    tree: Category[],
    dragId: number,
    targetId: number
  ): Category[] {
    return tree.map((node) => {
      if (node.children) {
        const ids = node.children.map((child) => child.id);
        if (ids.includes(dragId) && ids.includes(targetId)) {
          const newChildren = [...node.children];
          const draggedIndex = newChildren.findIndex(c => c.id === dragId);
          const targetIndex = newChildren.findIndex(c => c.id === targetId);
          const [dragged] = newChildren.splice(draggedIndex, 1);
          newChildren.splice(targetIndex, 0, dragged);

          // ✅ sequence 재정렬
          const reordered = newChildren.map((c, idx) => ({
            ...c,
            sequence: idx + 1,
          }));

          return {
            ...node,
            children: reordered,
          };
        } else {
          return {
            ...node,
            children: reorderCategoryWithinParent(node.children, dragId, targetId),
          };
        }
      }
      return node;
    });
  }






  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">카테고리 관리</h1>
        <CategoryTree
          categories={treeData}
          onMoveItem={setTreeData} // ✅ 핵심
        />
      </div>
    </DndProvider>
  );
}
