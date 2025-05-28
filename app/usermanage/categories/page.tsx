'use client';

import { DragDropContext, Draggable, Droppable,DropResult } from '@hello-pangea/dnd';
import React, { useState } from "react";


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
    name: "카테고리1",
    postCount: 3,
    type: "일반",
    sub: [
      { id: 101, name: "서브1", postCount: 1, type: "일반" },
      { id: 102, name: "서브2", postCount: 2, type: "일반" },
    ],
  },
  {
    id: 2,
    name: "카테고리2",
    postCount: 0,
    type: "일반",
    sub: [],
  },
];

// ======== 이동 타깃 선택 모달 ===========
interface CategorySelectModalProps {
  open: boolean;
  title: string;
  categories: Category[];
  excludeId: number | undefined; // 자기자신 제외
  onSelect: (targetId: number) => void;
  onClose: () => void;
}

function CategorySelectModal({
  open,
  title,
  categories,
  excludeId,
  onSelect,
  onClose
}: CategorySelectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[325px]">
        <h4 className="font-semibold text-base mb-4">{title}</h4>
        <div className="max-h-56 overflow-y-auto">
          <ul>
            {categories.filter(cat => cat.id !== excludeId).map(cat => (
              <li key={cat.id}>
                <button
                  className="w-full text-left px-3 py-2 my-1 rounded hover:bg-blue-50 transition"
                  onClick={() => onSelect(cat.id)}
                >{cat.name}</button>
              </li>
            ))}
          </ul>
        </div>
        <button
          className="w-full mt-4 px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
          onClick={onClose}
        >취소</button>
      </div>
    </div>
  );
}

// === 드래그&드롭용 고유 key 만들기
function getItemKey(type: "cat" | "sub", catId: number, subId?: number) {
  return type === "cat" ? `cat-${catId}` : `sub-${catId}-${subId}`;
}
// === 드래그 끝났을 때 처리 ===
function reorderList<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}
function flattenForDnd(categories: Category[]) {
  // 1차원으로 펼침, dnd 동작 위해 "cat/sub" 위치도 함께 표기
  const result: { type: "cat" | "sub", catIdx: number, subIdx?: number, cat: Category, sub?: SubCategory }[] = [];
  categories.forEach((cat, catIdx) => {
    result.push({ type: "cat", catIdx, cat });
    cat.sub.forEach((sub, subIdx) => {
      result.push({ type: "sub", catIdx, subIdx, cat, sub });
    });
  });
  return result;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [expanded, setExpanded] = useState<Record<number, boolean>>(
    Object.fromEntries(initialCategories.map(cat => [cat.id, true]))
  );
  // 이동 관련
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveMainId, setMoveMainId] = useState<number | null>(null);

  // 전체 펼침/접힘
  const handleExpandAll = (expand: boolean) => {
    setExpanded(
      Object.fromEntries(categories.map((cat) => [cat.id, expand]))
    );
  };

  const toggleSubs = (catId: number) => {
    setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  function handleEdit(catId: number, subId?: number) {
    setCategories((prev) =>
      prev.map((cat) => {
        if (typeof subId === "number" && cat.id === catId) {
          return {
            ...cat,
            sub: cat.sub.map((sub) =>
              sub.id === subId
                ? {
                  ...sub,
                  name: prompt("새 이름을 입력하세요", sub.name) || sub.name,
                }
                : sub
            ),
          };
        }
        if (cat.id === catId && subId === undefined) {
          return {
            ...cat,
            name: prompt("새 이름을 입력하세요", cat.name) || cat.name,
          };
        }
        return cat;
      })
    );
  }

  function handleDelete(catId: number, subId?: number) {
    if (!window.confirm("정말 삭제하시겠어요?")) return;
    setCategories((prev) =>
      prev
        .map((cat) => {
          if (typeof subId === "number" && cat.id === catId) {
            return { ...cat, sub: cat.sub.filter((sub) => sub.id !== subId) };
          }
          return cat;
        })
        .filter((cat) => !(cat.id === catId && subId === undefined))
    );
  }

  function handleSetting(catId: number, subId?: number) {
    if (typeof subId === "number") {
      alert(`서브카테고리 설정: ${catId} / ${subId}`);
    } else {
      alert(`카테고리 설정: ${catId}`);
    }
  }

  function handleAddSub(parentId: number) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === parentId
          ? {
            ...cat,
            sub: [
              ...cat.sub,
              {
                id: Date.now(),
                name: "새 서브카테고리",
                postCount: 0,
                type: "일반",
              },
            ],
          }
          : cat
      )
    );
  }

  function handleMove(fromIdx: number, toIdx: number) {
    setCategories((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }

  function handleSubMove(catId: number, fromIdx: number, toIdx: number) {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === catId
          ? {
            ...cat,
            sub: (() => {
              const s = [...cat.sub];
              const [item] = s.splice(fromIdx, 1);
              s.splice(toIdx, 0, item);
              return s;
            })(),
          }
          : cat
      )
    );
  }

  // 서브카테고리 -> 최상위로 승격
  function handlePromoteSubToMain(catId: number, subId: number) {
    setCategories((prev) => {
      let promoted: SubCategory | undefined;
      const updated = prev.map((cat) => {
        if (cat.id === catId) {
          const restSubs = cat.sub.filter((sub) => {
            if (sub.id === subId) {
              promoted = sub;
              return false;
            }
            return true;
          });
          return { ...cat, sub: restSubs };
        }
        return cat;
      });

      if (promoted) {
        return [
          ...updated,
          { ...promoted, sub: [], id: Date.now() },
        ];
      }
      return updated;
    });
  }

  // 최상위를 다른 카테고리 하위로
  function handleDemoteMainToSub(mainId: number, targetCatId: number) {
    setCategories((prev) => {
      // 분리
      const mainIdx = prev.findIndex(cat => cat.id === mainId);
      if (mainIdx === -1) return prev;
      const [mainCat] = prev.splice(mainIdx, 1);
      // 하위로
      return prev.map(cat =>
        cat.id === targetCatId
          ? {
            ...cat,
            sub: [
              ...cat.sub,
              { ...mainCat, sub: undefined }
            ]
          }
          : cat
      );
    });
  }

  // 모달 열기
  function openDemoteModal(catId: number) {
    setMoveMainId(catId);
    setMoveModalOpen(true);
  }
  // 모달에서 타깃 선택
  function handleSelectMoveTarget(targetId: number) {
    if (moveMainId !== null) {
      handleDemoteMainToSub(moveMainId, targetId);
      setMoveModalOpen(false);
      setMoveMainId(null);
    }
  }
  function handleCloseMoveModal() {
    setMoveModalOpen(false);
    setMoveMainId(null);
  }

  // === 드래그&드롭 처리 ===
  function onDragEnd(result: DropResult) {
    const flatItems = flattenForDnd(categories);
    if (!result.destination) return;

    const fromIdx = result.source.index;
    const toIdx = result.destination.index;
    if (fromIdx === toIdx) return; // 변경 없음

    const moved = flatItems[fromIdx];
    const nextFlat = Array.from(flatItems);
    const [item] = nextFlat.splice(fromIdx, 1);
    nextFlat.splice(toIdx, 0, item);

    // 2차원 구조로 복원
    const newCats: Category[] = [];
    let lastCat: Category | null = null;
    nextFlat.forEach(row => {
      if (row.type === 'cat') {
        // 최상위 카테고리
        lastCat = {
          ...row.cat,
          sub: [],
        };
        newCats.push(lastCat);
      } else if (row.type === 'sub' && lastCat) {
        // 가장 마지막 카테고리의 하위로
        lastCat.sub.push(row.sub!);
      }
    });
    setCategories(newCats);
  }

  // -- 카테고리, 서브카테고리 리스트 1차원으로 드래그 지원 --
  const flat = flattenForDnd(categories);

  // === 렌더 ===
  return (
    <div className="category-wrapper bg-gray-50 min-h-screen p-7">
      <h3 className="font-bold text-2xl mb-4 tracking-tight">카테고리 관리</h3>

      <div className="mb-5">
        <button className="mr-2 text-xs border border-gray-300 px-3 py-1.5 rounded
        hover:bg-blue-50 duration-150" onClick={() => setExpanded(Object.fromEntries(categories.map((cat) =>
          [cat.id, true])))}>전체 펼치기</button>
        <button className="text-xs border border-gray-300 px-3 py-1.5 rounded
        hover:bg-gray-100 duration-150" onClick={() => setExpanded(Object.fromEntries(categories.map((cat) =>
          [cat.id, false])))}>전체 닫기</button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="category-list">
          {(provided) => (
            <ul className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
              {flat.map((item, idx) => {
                if (item.type === 'cat') {
                  const cat = item.cat;
                  return (
                    <Draggable key={getItemKey("cat", cat.id)} draggableId={getItemKey("cat", cat.id)} index={idx}>
                      {(provided, snapshot) => (
                        <li ref={provided.innerRef} {...provided.draggableProps}
                            className={`border rounded-lg bg-white group shadow ring-2 ${snapshot.isDragging ? 
                              "ring-blue-200" : "ring-transparent"} transition`}>
                          {/* -------- 메인 카테고리 ------- */}
                          <div className="flex items-center gap-2 pl-2 py-3 relative">
                            {/* 펼침/접힘 */}
                            {cat.sub.length > 0 ? (
                              <button
                                onClick={() => toggleSubs(cat.id)}
                                className="w-6 text-center text-gray-500"
                                type="button"
                                aria-label={expanded[cat.id] ? "접기" : "펼치기"}
                              >
                                {expanded[cat.id] ? <span>▼</span> : <span>▶</span>}
                              </button>
                            ) : (
                              <span className="w-6" />
                            )}
                            <span {...provided.dragHandleProps} className="cursor-move text-gray-400 select-none ml-1 mr-4">☰</span>
                            <span className="font-semibold truncate mr-3 text-lg">{cat.name}</span>
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                              {cat.type}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">{cat.postCount}개</span>
                            <div className="flex items-center gap-1 ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
                              <button className="text-xs text-blue-600 px-2.5 py-1 rounded hover:bg-blue-50" onClick={() => handleAddSub(cat.id)}>서브추가</button>
                              <button className="text-xs text-gray-800 px-2 py-1 rounded hover:bg-gray-100" onClick={() => handleEdit(cat.id)}>수정</button>
                              <button className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50" onClick={() => handleDelete(cat.id)}>삭제</button>
                              <button className="text-xs text-gray-700 px-2 py-1 rounded hover:bg-gray-100" onClick={() => handleSetting(cat.id)}>설정</button>
                              {/* 카테고리 이동 */}
                              {categories.length > 1 && (
                                <button className="text-xs text-yellow-700 ml-2 px-2 py-1 rounded border
                                border-yellow-100 hover:bg-yellow-50" onClick={() => openDemoteModal(cat.id)}>하위로 이동</button>
                              )}
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  );
                } else {
                  // sub
                  const cat = item.cat;
                  const sub = item.sub!;
                  return (
                    <Draggable key={getItemKey("sub", cat.id, sub.id)} draggableId={getItemKey("sub", cat.id, sub.id)} index={idx}>
                      {(provided, snapshot) => (
                        <li ref={provided.innerRef} {...provided.draggableProps} className={`ml-8 border-l-4 
                        border-gray-300 rounded bg-gray-50 py-2 px-4 group ring-2 ${snapshot.isDragging ? 
                          "ring-blue-200" : "ring-transparent"} transition`}>
                          {/* -------- 서브카테고리 -------- */}
                          <div className="flex items-center gap-2">
                            <span {...provided.dragHandleProps} className="cursor-move text-gray-400 select-none mr-4">☰</span>
                            <span className="truncate mr-3">{sub.name}</span>
                            <span className="ml-1 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">{sub.type}</span>
                            <span className="ml-2 text-xs text-gray-500">{sub.postCount}개</span>
                            <div className="flex items-center gap-1 ml-auto opacity-80 group-hover:opacity-100 transition-opacity">
                              <button className="text-xs text-blue-500 px-2 py-1 rounded hover:bg-blue-50" onClick={() => handleAddSub(cat.id)}>서브추가</button>
                              <button className="text-xs text-gray-800 px-2 py-1 rounded hover:bg-gray-100" onClick={() => handleEdit(cat.id, sub.id)}>수정</button>
                              <button className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50" onClick={() => handleDelete(cat.id, sub.id)}>삭제</button>
                              <button className="text-xs text-yellow-700 px-2 py-1 rounded border
                              border-yellow-100 hover:bg-yellow-50" onClick={() => handlePromoteSubToMain(cat.id, sub.id)}>최상위로</button>
                              <button className="text-xs text-gray-700 px-2 py-1 rounded hover:bg-gray-100" onClick={() => handleSetting(cat.id, sub.id)}>설정</button>
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  );
                }
              })}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      {/* -------- 카테고리 이동 모달 --------- */}
      <CategorySelectModal
        open={moveModalOpen}
        title="서브로 이동할 카테고리 선택"
        categories={categories}
        excludeId={moveMainId ?? undefined}
        onSelect={handleSelectMoveTarget}
        onClose={handleCloseMoveModal}
      />
    </div>
  );
}