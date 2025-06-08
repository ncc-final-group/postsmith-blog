/* eslint-disable indent */
  'use client';

  import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd';
  import clsx from 'clsx';
  import React, { useState } from 'react';

  import { CategoryMoveModal } from '@app/usermanage/categories/CategoryMoveModal';

  // 타입 정의
  type SubCategory = {
    id: number;
    name: string;
    postCount: number;
    type: string;
  };

  type Category = {
    id: number;
    name: string;
    postCount: number;
    type: string;
    sub: SubCategory[];
  };

  // 초기 데이터
  const initialCategories: Category[] = [
    {
      id: 1,
      name: '카테고리1',
      postCount: 3,
      type: '일반',
      sub: [
        { id: 101, name: '서브1', postCount: 1, type: '일반' },
        { id: 102, name: '서브2', postCount: 2, type: '일반' },
      ],
    },
    {
      id: 2,
      name: '카테고리2',
      postCount: 0,
      type: '일반',
      sub: [],
    },
  ];

  // ======== 이동 타깃 선택 모달 ===========
  function getItemKey(type: 'cat' | 'sub', catId: number, subId?: number) {
    return type === 'cat' ? `cat-${catId}` : `sub-${catId}-${subId}`;
  }

  // === 드래그 끝났을 때 처리 ===
  const CategoryItem = ({ title, type, postCount, isMain = false }: { title: string; type: string; postCount: number; isMain?: boolean }) => {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          {/* 전체 컨테이너는 300px 유지 */}
          <div className="w-[300px]">
            {/* 실제 텍스트는 더 작은 공간으로 제한 */}
            <div className="w-[200px]">
              <div className="truncate" title={title}>
                <span className={clsx(isMain ? 'text-lg font-semibold' : 'font-medium')}>{title}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className={clsx('rounded px-2 py-0.5 text-xs', isMain ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>{type}</span>
            <span className="text-gray-400">|</span>
            <span className="text-xs text-gray-500">{postCount}개의 글</span>
          </div>
        </div>
      </div>
    );
  };

  export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [expanded, setExpanded] = useState<Record<number, boolean>>(Object.fromEntries(initialCategories.map((cat) => [cat.id, true])));
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
            (sub) =>
              ({
                id: sub.id,
                name: sub.name,
                postCount: sub.postCount,
                type: sub.type,
                sub: [],
              }) as Category,
          );

          // 2. 이동할 카테고리를 서브카테고리 형태로 변환
          const newSub: SubCategory = {
            id: sourceCat.id,
            name: sourceCat.name,
            postCount: sourceCat.postCount,
            type: sourceCat.type,
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
            postCount: subToMove.postCount,
            type: subToMove.type,
            sub: [],
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
            postCount: subToMove.postCount,
            type: subToMove.type,
          });

          return newCats;
        }

        return prev;
      });

      // 이동 모달 닫기
      setMoveModal({ isOpen: false, item: null });
    };

    // 기존 state 선언부 근처에 추가
    const [mainTitle, setMainTitle] = useState('분류 전체보기');
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState('일반');

    // State 수정 (editModalOpen과 editTarget 대신)
    const [editingId, setEditingId] = useState<{ catId: number; subId?: number } | null>(null);
    const [editingName, setEditingName] = useState('');
    const [editingType, setEditingType] = useState('일반');

    // 전체 펼침/접힘
    const handleExpandAll = (expand: boolean) => {
      setExpanded(Object.fromEntries(categories.map((cat) => [cat.id, expand])));
    };

    const toggleSubs = (catId: number) => {
      setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));
    };

    const [isDraggingOver, setIsDraggingOver] = useState<{
      id: number | null;
      side: 'left' | 'right' | null;
    }>({ id: null, side: null });

    function handleEdit(catId: number, subId?: number) {
      const category = categories.find((cat) => cat.id === catId);
      if (!category) return;

      if (typeof subId === 'number') {
        const sub = category.sub.find((s) => s.id === subId);
        if (!sub) return;
        setEditingName(sub.name);
        setEditingType(sub.type);
      } else {
        setEditingName(category.name);
        setEditingType(category.type);
      }
      setEditingId({ catId, subId });
    }

    function handleDelete(catId: number, subId?: number) {
      // 서브카테고리 삭제
      if (typeof subId === 'number') {
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

    function handleAddSub(parentId: number) {
      // 서브카테고리 추가
      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === parentId) {
            return {
              ...cat,
              sub: [
                ...cat.sub,
                {
                  id: Date.now(),
                  name: '새 서브카테고리',
                  postCount: 0,
                  type: '일반',
                },
              ],
            };
          } else {
            return cat;
          }
        }),
      );

      // 해당 카테고리를 펼침 상태로 변경
      setExpanded((prev) => ({
        ...prev,
        [parentId]: true,
      }));
    }

    function handleAddCategory() {
      if (!newCategoryName.trim()) return;

      const newCategory: Category = {
        id: Date.now(),
        name: newCategoryName.trim(),
        postCount: 0,
        type: newCategoryType,
        sub: [],
      };

      // 배열의 끝이 아닌 시작 부분에 새 카테고리 추가
      setCategories((prev) => [newCategory, ...prev]);

      setIsAdding(false);
      setNewCategoryName('');
      setNewCategoryType('일반');
    }

    // 서브카테고리 -> 최상위로 승격
    // === 플랫 리스트 생성 함수를 컴포넌트 안으로 이동 ===
    const flattenForDnd = (categories: Category[]) => {
      const result: { type: 'cat' | 'sub'; catIdx: number; subIdx?: number; cat: Category; sub?: SubCategory }[] = [];

      categories.forEach((cat, catIdx) => {
        result.push({ type: 'cat', catIdx, cat });
        // expanded 상태일 때만 서브카테고리 추가
        if (expanded[cat.id]) {
          cat.sub.forEach((sub, subIdx) => {
            result.push({
              type: 'sub',
              catIdx,
              subIdx,
              cat,
              sub,
            });
          });
        }
      });

      return result;
    };

    const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;

      const fromIdx = result.source.index;
      const toIdx = result.destination.index;
      if (fromIdx === toIdx) return;

      const flatItems = flattenForDnd(categories);
      const moved = flatItems[fromIdx];
      const target = flatItems[toIdx];

      // 메인 카테고리 이동 시 서브카테고리 영역인지 확인
      if (moved.type === 'cat') {
        const isTargetSubArea = target.type === 'sub';
        const isLastMainCategory = target.type === 'cat' && flatItems.slice(toIdx + 1).every((item) => item.type === 'sub');

        if (isTargetSubArea || isLastMainCategory) {
          // 순서 이동으로 처리
          setCategories((prev) => {
            const newCats = [...prev];
            const [movedCat] = newCats.splice(moved.catIdx, 1);
            // 타겟이 서브카테고리인 경우, 해당 메인 카테고리 다음 위치로 이동
            const targetIdx = isTargetSubArea ? target.catIdx + 1 : target.catIdx;
            newCats.splice(targetIdx, 0, movedCat);
            return newCats;
          });
          return;
        }
      }

      // 서브카테고리를 메인 카테고리로 승격
      if (moved.type === 'sub' && target.type === 'cat') {
        setCategories((prev) => {
          let newCats = prev.map((cat) => {
            if (cat.id === moved.cat.id) {
              // 기존 서브카테고리 제거
              return {
                ...cat,
                sub: cat.sub.filter((s) => s.id !== moved.sub!.id),
              };
            }
            return cat;
          });

          // 새로운 메인 카테고리 생성
          const newCat: Category = {
            id: moved.sub!.id,
            name: moved.sub!.name,
            type: moved.sub!.type,
            postCount: moved.sub!.postCount,
            sub: [],
          };

          // 타겟 위치에 삽입
          const insertIdx = target.catIdx;
          newCats.splice(insertIdx, 0, newCat);

          return newCats;
        });
        return;
      }

      // 기존의 같은 레벨 간 이동 로직
      if (moved.type === 'cat' && target.type === 'cat') {
        setCategories((prev) => {
          const newCats = [...prev];
          const [movedCat] = newCats.splice(moved.catIdx, 1);
          newCats.splice(target.catIdx, 0, movedCat);
          return newCats;
        });
        return;
      }

      if (moved.type === 'sub' && target.type === 'sub') {
        setCategories((prev) => {
          const newCats = prev.map((cat) => ({ ...cat, sub: [...cat.sub] }));
          const sourceCat = newCats[moved.catIdx];
          const targetCat = newCats[target.catIdx];

          if (moved.catIdx === target.catIdx) {
            // 같은 카테고리 내 이동
            const [movedSub] = sourceCat.sub.splice(moved.subIdx!, 1);
            sourceCat.sub.splice(target.subIdx!, 0, movedSub);
          } else {
            // 다른 카테고리로 이동
            const [movedSub] = sourceCat.sub.splice(moved.subIdx!, 1);
            targetCat.sub.splice(target.subIdx!, 0, movedSub);
          }

          return newCats;
        });
      }
    };

    // 저장 처리 함수
    function handleSaveEdit() {
      if (!editingId || !editingName.trim()) return;

      setCategories((prev) =>
        prev.map((cat) => {
          if (cat.id === editingId.catId) {
            if (editingId.subId !== undefined) {
              // 서브카테고리 수정
              return {
                ...cat,
                sub: cat.sub.map((sub) => {
                  if (sub.id === editingId.subId) {
                    return {
                      ...sub,
                      name: editingName.trim(),
                      type: editingType,
                    };
                  } else {
                    return sub;
                  }
                }),
              };
            }
            // 메인 카테고리 수정
            return { ...cat, name: editingName.trim(), type: editingType };
          }
          return cat;
        }),
      );

      setEditingId(null);
      setEditingName('');
      setEditingType('일반');
    }

    // -- 카테고리, 서브카테고리 리스트 1차원으로 드래그 지원 --
    const flat = flattenForDnd(categories);

    // === 렌더 ===
    return (
      <div className="min-h-screen p-7">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-semilight flex items-center text-xl text-gray-800">
              카테고리 관리
            </h1>
            <button
              onClick={() => setIsAdding(true)}
              className={clsx(
                'flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2',
                'text-sm font-medium text-gray-700 transition-colors duration-200 cursor-pointer hover:bg-blue-500 hover:text-white',
              )}
            >
              <span className="text-lg">+</span>
              카테고리 추가
            </button>
          </div>


          <DragDropContext
            onDragEnd={onDragEnd}
            onDragStart={(start) => {
              const draggedItem = flat[start.source.index];
              document.body.setAttribute('data-dragging-type', draggedItem.type);
            }}
            onDragUpdate={(update) => {
              if (!update.destination) return;

              const flatItems = flattenForDnd(categories); // 여기서 flatItems 계산
              const draggedItem = flatItems[update.source.index];
              const targetItem = flatItems[update.destination.index];

              if (!targetItem || targetItem.type !== 'cat') return;

              const draggedElement = document.querySelector(`[data-rbd-draggable-id="${update.draggableId}"]`);
              if (!draggedElement) return;

              const targetElement = document.querySelector(`[data-rbd-draggable-id="cat-${targetItem.cat.id}"]`);
              if (!targetElement) return;

              const dragRect = draggedElement.getBoundingClientRect();
              const targetRect = targetElement.getBoundingClientRect();

              const isRightSide = dragRect.left + dragRect.width / 2 > targetRect.left + targetRect.width / 2;

              setIsDraggingOver({
                id: targetItem.cat.id,
                side: isRightSide ? 'right' : 'left',
              });

              // 드래그 중인 아이템이 메인 카테고리일 때만 시각적 표시 추가
              if (draggedItem.type === 'cat') {
                if (isRightSide) {
                  draggedElement.classList.add('dragging-to-sub');
                } else {
                  draggedElement.classList.remove('dragging-to-sub');
                }

                document.querySelectorAll('[data-rbd-draggable-id^="cat-"]').forEach((item) => {
                  if (item !== draggedElement) {
                    item.classList.toggle('prev-dragging', !isRightSide);
                  }
                });
              }
            }}
          >
          <Droppable droppableId="category-list">
            {(provided) => (
              <ul className="mb-10 flex min-h-[300px] w-full max-w-4xl flex-col rounded-xl border
            border-gray-300 bg-white p-7 shadow" {...provided.droppableProps} ref={provided.innerRef}>
                {/* --- 안내문구 + 전체펼침/닫기 버튼 --- */}
                <li className="mb-4 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm leading-relaxed text-gray-700">
                      카테고리 순서를 변경하고 주제 연결을 설정할 수 있습니다.
                      <br />
                      드래그 앤 드롭으로 카테고리 순서를 변경할 수 있습니다.
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{categories.length}/100</span>
                      <div className="flex-shrink-0">
                        <button
                          className="mr-2 cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 text-xs transition hover:bg-gray-50"
                          onClick={() => handleExpandAll(true)}
                        >
                          전체 펼치기
                        </button>
                        <button
                          className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-1.5 text-xs transition hover:bg-gray-50"
                          onClick={() => handleExpandAll(false)}
                        >
                          전체 닫기
                        </button>
                      </div>
                    </div>
                  </div>
                </li>

                {/* --- 분류 전체보기 --- */}
                <li className="group mb-4 rounded-lg border border-gray-300 bg-white shadow-sm">
                  {' '}
                  {/* group 추가 */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-lg font-bold">{mainTitle}</span>
                    <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      {' '}
                      {/* hover 효과 추가 */}
                      <button onClick={() => setIsAdding(true)} className="cursor-pointer
                      rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800
                      hover:bg-gray-50">
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
                </li>

                {/* 새 카테고리 추가 폼 */}
                {isAdding && (
                  <li className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3">
                      <div className="text-sm font-medium">새 카테고리 추가</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="카테고리 이름"
                          className="flex-1 rounded border px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none border-gray-300"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCategoryName.trim()) {
                              handleAddCategory();
                            }
                          }}
                          autoFocus
                        />
                        <select
                          value={newCategoryType}
                          onChange={(e) => setNewCategoryType(e.target.value)}
                          className="rounded border px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        >
                          <option value="일반">일반</option>
                          <option value="공지">공지</option>
                          <option value="자유">자유</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsAdding(false);
                            setNewCategoryName('');
                          }}
                          className="rounded border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleAddCategory}
                          className="rounded border bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
                          disabled={!newCategoryName.trim()}
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  </li>
                )}

                {categories.length === 0 ? (
                  <li className="py-12 text-center text-gray-500">
                    생성된 카테고리가 없습니다.
                    <br />
                    <span className="leading-relaxed">카테고리를 생성해주세요.</span>
                  </li>
                ) : (
                  flat
                    .map((item, idx) => {
                      if (item.type === 'cat') {
                        const cat = item.cat;
                        return (
                          <Draggable key={getItemKey('cat', cat.id)} draggableId={getItemKey('cat', cat.id)} index={idx}>
                            {(provided, snapshot) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                data-type={'cat'}
                                data-rbd-draggable-id={`cat-${cat.id}`}
                                className={clsx(
                                  'group relative rounded-lg border border-gray-300 bg-white shadow-sm hover:shadow-md', // category-item 추가
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-200' : 'ring-transparent',
                                  'transition-all duration-200',
                                  'mb-2',
                                )}
                              >
                                {/* 드롭 영역 표시 - 기존 내용 위에 추가 */}
                                <div
                                  className={clsx(
                                    'absolute inset-0 flex pointer-events-none z-10'
                                    // 드래그시 배경색, 테두리색 추가 부분을 모두 제거!
                                  )}
                                >
                                  <div className="flex-1 m-1 border-2 border-dashed border-transparent rounded transition-all"></div>
                                  <div className="flex-1 m-1 border-2 border-dashed border-transparent rounded transition-all"></div>
                                </div>


                                {/* -------- 메인 카테고리 ------- */}
                                <div className="relative flex items-center gap-2 py-3 pl-2">
                                  {/* 펼침/접힘 버튼 */}
                                  {cat.sub.length > 0 ? (
                                    <button
                                      onClick={() => toggleSubs(cat.id)}
                                      className="flex h-6 w-6 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                      type="button"
                                      aria-label={expanded[cat.id] ? '접기' : '펼치기'}
                                    >
                                      {expanded[cat.id] ? '▼' : '▶'}
                                    </button>
                                  ) : (
                                    <span className="w-6" />
                                  )}
                                  <span
                                    {...provided.dragHandleProps}
                                    className="mr-4 cursor-move text-gray-400 transition-colors select-none hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    ☰
                                  </span>


                                  {editingId?.catId === cat.id && editingId.subId === undefined ? (
                                    <div className="flex flex-1 items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        className="flex-1 rounded border px-3 py-1.5 text-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveEdit();
                                          if (e.key === 'Escape') setEditingId(null);
                                        }}
                                      />
                                      <select
                                        value={editingType}
                                        onChange={(e) => setEditingType(e.target.value)}
                                        className="rounded border px-3 py-1.5 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                      >
                                        <option value="일반">일반</option>
                                        <option value="공지">공지</option>
                                        <option value="자유">자유</option>
                                      </select>
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
                                    <>
                                      <CategoryItem title={cat.name} type={cat.type} postCount={cat.postCount} isMain={true} />
                                    </>
                                  )}

                                  {/* 버튼들 */}
                                  {!editingId && (
                                    <div className="mr-3 ml-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        className="cursor-pointer rounded border border-gray-700 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                        onClick={() => handleAddSub(cat.id)}
                                      >
                                        추가
                                      </button>
                                      <button
                                        className="cursor-pointer rounded border border-gray-700 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                        onClick={() => handleEdit(cat.id)}
                                      >
                                        수정
                                      </button>
                                      <button
                                        className="cursor-pointer rounded border border-gray-700 bg-white px-2 py-1 text-xs text-red-500 hover:bg-gray-50"
                                        onClick={() => handleDelete(cat.id)}
                                      >
                                        삭제
                                      </button>
                                      <button
                                        className="cursor-pointer rounded border border-gray-700 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                        onClick={() => handleSetting(cat.id)}
                                      >
                                        설정
                                      </button>
                                      {categories.length > 1 && (
                                        <button
                                          className="cursor-pointer rounded border border-gray-700 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                          onClick={() =>
                                            setMoveModal({
                                              isOpen: true,
                                              item: {
                                                categoryId: cat.id,
                                                // subId를 제거하여 메인 카테고리임을 명확히 함
                                              },
                                            })
                                          }
                                        >
                                          이동
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </li>
                            )}
                          </Draggable>
                        );
                      } else {
                        // sub
                        const cat = item.cat;
                        const sub = item.sub!;

                        // expanded 상태에 따라 서브카테고리 표시 여부 결정
                        if (!expanded[cat.id]) return null;

                        return (
                          <Draggable key={getItemKey('sub', cat.id, sub.id)} draggableId={getItemKey('sub', cat.id, sub.id)} index={idx}>
                            {(provided, snapshot) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                data-type={'sub'}
                                data-rbd-draggable-id={`sub-${cat.id}-${sub.id}`}
                                className={clsx(
                                  'group ml-8 rounded border-l-4 border-gray-700 bg-gray-50',
                                  'hover:bg-gray-100/50',
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-200' : 'ring-transparent',
                                  'transition-all duration-200',
                                  'px-4 py-2.5',
                                  'mb-1',
                                )} // my-2 제거
                              >
                                {/* -------- 서브카테고리 -------- */}
                                <div className="flex items-center gap-2">
                                <span {...provided.dragHandleProps} className="mr-4 cursor-move text-gray-400 select-none">
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
                                      <select
                                        value={editingType}
                                        onChange={(e) => setEditingType(e.target.value)}
                                        className="rounded border px-3 py-1.5 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                                      >
                                        <option value="일반">일반</option>
                                        <option value="공지">공지</option>
                                        <option value="자유">자유</option>
                                      </select>
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
                                    <>
                                      <CategoryItem title={sub.name} type={sub.type} postCount={sub.postCount} />
                                    </>
                                  )}

                                  {/* 버튼들 */}
                                  {!editingId && (
                                    <div className="ml-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                        onClick={() => handleEdit(cat.id, sub.id)}
                                      >
                                        수정
                                      </button>
                                      <button
                                        className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-red-500 hover:bg-gray-50"
                                        onClick={() => handleDelete(cat.id, sub.id)}
                                      >
                                        삭제
                                      </button>
                                      <button
                                        className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                        onClick={() => handleSetting(cat.id, sub.id)}
                                      >
                                        설정
                                      </button>
                                      <button
                                        className="cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-50"
                                        onClick={() =>
                                          setMoveModal({
                                            isOpen: true,
                                            item: {
                                              categoryId: cat.id,
                                              subId: sub.id, // 서브카테고리 ID 전달
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
                            )}
                          </Draggable>
                        );
                      }
                    })
                    .filter(Boolean)
                )}
                {provided.placeholder}

                {/* 카테고리 생성 버튼을 ul 안으로 이동 */}
                <button
                  onClick={() => setIsAdding(true)}
                  className={clsx(
                    'mt-4 w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-transparent px-4 py-3 text-gray-500 transition-colors',
                    'hover:border-gray-400 hover:text-gray-600'
                  )}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-2">+</span>
                    <span>카테고리 생성</span>
                  </div>
                </button>
              </ul>
            )}
          </Droppable>
        </DragDropContext>
        {moveModal.isOpen && moveModal.item && (
          <CategoryMoveModal
            isOpen={moveModal.isOpen}
            onClose={() => setMoveModal({ isOpen: false, item: null })}
            categories={categories}
            selectedItem={
              moveModal.item
                ? {
                  categoryId: moveModal.item.categoryId,
                  subId: moveModal.item.subId || 0, // 명시적으로 number 타입 보장
                }
                : null
            }
            onMove={handleCategoryMove}
          />
        )}
      </div>
    </div>
  );
}
