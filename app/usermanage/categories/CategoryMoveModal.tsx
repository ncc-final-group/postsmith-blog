/*
import { Dialog } from '@headlessui/react';
import { useState } from 'react';

type Category = {
  id: number;
  name: string;
  sub: {
    id: number;
    name: string;
  }[];
};

interface CategoryMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedItem: {
    categoryId: number;
    subId: number;
  } | null;
  onMove: (targetId: number, asMainCategory: boolean) => void;
}

export function CategoryMoveModal({ isOpen, onClose, categories, selectedItem, onMove }: CategoryMoveModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  const filteredCategories = categories
    .filter((cat) => (selectedItem ? cat.id !== selectedItem.categoryId : true))
    .filter((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleMove = async (targetCategoryId: number, asMainCategory: boolean) => {
    setIsMoving(true);
    try {
      await onMove(targetCategoryId, asMainCategory);
      onClose();
    } catch (error) {
    } finally {
      setIsMoving(false);
    }
  };
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-sm rounded-lg bg-white p-6">
          <Dialog.Title as="h3" className="mb-4 text-lg font-medium">
            카테고리 이동
          </Dialog.Title>

          {/!* 검색 입력창 *!/}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="카테고리 검색..."
              className="w-full rounded-md border px-4 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              autoComplete="off"
            />
          </div>

          {/!* 카테고리 목록 *!/}
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {/!* 일반 카테고리 옵션 *!/}
            <div
              onClick={() => !isMoving && handleMove(0, true)}
              className={`cursor-pointer rounded-lg border p-4 transition-colors duration-200 hover:bg-blue-50 ${isMoving ? 'cursor-not-allowed opacity-50' : ''}`}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">일반 카테고리로 설정</span>
                <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">최상위로 이동</span>
              </div>
            </div>

            {/!* 다른 카테고리 목록 *!/}
            {filteredCategories.length === 0 ? (
              <div className="py-4 text-center text-gray-500">이동 가능한 카테고리가 없습니다.</div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => !isMoving && handleMove(category.id, false)}
                  className={`cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${isMoving ? 'cursor-not-allowed opacity-50' : ''} transition-all duration-200`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.name}</span>
                    {/*<span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">하위로 이동 ({category.postCount}개의 글)</span>*/}
                  </div>
                </div>
              ))
            )}
          </div>

          {/!* 하단 버튼 *!/}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100" disabled={isMoving}>
              취소
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
*/
