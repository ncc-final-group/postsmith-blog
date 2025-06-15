'use client';

import { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Category, CategoryDto, CategoryTree } from '@components/category/CategoryTree';

//트리 구조를 평탄화 -> 안하면 tree구조로 저장되기때문에 평탄화.
function flattenTree(categories: Category[], parentId: number | null = null): CategoryDto[] {
  return categories.flatMap((cat, index) => {
    const { id, name, description, blogId } = cat;
    const flatItem: CategoryDto = {
      id,
      name,
      description,
      parentId,
      sequence: index,
      blogId,
    };

    const children = cat.children ? flattenTree(cat.children, id) : [];
    return [flatItem, ...children];
  });
}

// depth 값을 설정하는 함수
function setDepth(categories: Category[], depth: number = 0): Category[] {
  return categories.map(category => ({
    ...category,
    depth,
    children: category.children ? setDepth(category.children, depth + 1) : undefined
  }));
}

export default function CategoriesPage() {
  const [treeData, setTreeData] = useState<Category[]>([]);
  const [savedData, setSavedData] = useState<Category[]>([]);
  const [nextTempId, setNextTempId] = useState(-1); // 신규 생성 시 음수 ID 관리용

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //저장할게 생기면 save 버튼 활성화 체크용 .
  const isDirty = JSON.stringify(treeData) !== JSON.stringify(savedData);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8080/api/categories/tree'); // 백엔드 카테고리 API 경로
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

  function handleCreate(newCategoryData: Omit<Category, 'id' | 'children' | 'depth'>) {
    const newCategory: Category = {
      ...newCategoryData,
      id: nextTempId, // 음수 ID 부여
      children: [],
      depth: 0, // 적절히 계산해서 넣기
    };
    setNextTempId(nextTempId - 1);
    setTreeData([...treeData, newCategory]);
  }

  async function saveAll() {
    try {
      const res = await fetch('http://localhost:8080/api/categories/saveAll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(treeData),
      });
      if (!res.ok) throw new Error('저장 실패');
      const savedCategories = await res.json();

      setSavedData(savedCategories); // 성공 시 상태 동기화
      alert('저장 완료!');
    } catch (e) {
      if (e instanceof Error) {
        alert(`저장 오류: ${e.message}`);
      } else {
        alert('저장 오류: 알 수 없는 에러');
      }
    }
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
