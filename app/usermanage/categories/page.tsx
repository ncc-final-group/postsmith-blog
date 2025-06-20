'use client';

import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Category, CategoryTree } from '@components/category/CategoryTree';

// depth 값을 설정하는 함수
function setDepth(categories: Category[], depth = 0): Category[] {
  return categories.map((category) => ({
    ...category,
    depth,
    children: category.children ? setDepth(category.children, depth + 1) : [],
  }));
}

export default function CategoriesPage() {
  const [treeData, setTreeData] = useState<Category[]>([]);
  const [savedData, setSavedData] = useState<Category[]>([]);
  const [nextTempId, setNextTempId] = useState(-1); // 신규 생성 시 음수 ID 관리용
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function updateSequence(categories: Category[]): Category[] {
    return categories.map((cat, index) => ({
      ...cat,
      sequence: index,
      children: cat.children ? updateSequence(cat.children) : [],
    }));
  }

  const handleMoveItem = (newTree: Category[]) => {
    const updatedTree = updateSequence(newTree);
    setTreeData(updatedTree);
  };

  //저장할게 생기면 save 버튼 활성화 체크용 .
  JSON.stringify(treeData) !== JSON.stringify(savedData);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const res = await fetch(process.env.NEXT_PUBLIC_API_SERVER + '/api/categories/tree'); // 백엔드 카테고리 API 경로
        if (!res.ok) throw new Error('데이터를 불러오는 데 실패했습니다.');
        const data = await res.json();
        // depth 값을 설정하여 저장
        setTreeData(setDepth(data));
        setSavedData(setDepth(data));
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-6xl p-6">
        <h1 className="mb-4 text-xl font-bold text-gray-800">카테고리 관리</h1>
        <CategoryTree categories={treeData} onMoveItem={handleMoveItem} blogId={1} />
      </div>
    </DndProvider>
  );
}
