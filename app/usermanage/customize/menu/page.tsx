'use client';

import React, { useEffect, useState } from 'react';

import AddMenuForm from '@components/menu/AddMenuForm';
import MenuList from '@components/menu/MenuList';
import { MenuType } from '@components/menu/Types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { v4 as uuidv4 } from 'uuid';  // 만약 uuid 라이브러리 써도 좋음


const defaultMenus: MenuType[] = [
  { id: 1, name: '홈', type: 'DEFAULT', uri: '/', isBlank: false, isDefault: true },
  { id: 2, name: '태그', type: 'DEFAULT', uri: '/tags', isBlank: false, isDefault: true },
  { id: 3, name: '방명록', type: 'DEFAULT', uri: '/guestbook', isBlank: false, isDefault: true },
];

// 메뉴 배열 비교 함수
function arraysEqual(arr1: MenuType[], arr2: MenuType[]) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (
      arr1[i].id !== arr2[i].id ||
      arr1[i].name !== arr2[i].name ||
      arr1[i].type !== arr2[i].type ||
      arr1[i].uri !== arr2[i].uri ||
      arr1[i].isBlank !== arr2[i].isBlank ||
      !!arr1[i].isDefault !== !!arr2[i].isDefault
    ) {
      return false;
    }
  }
  return true;
}

const MenuManagerPage = () => {
  const [menus, setMenus] = useState<MenuType[]>([]);  // 기본값 빈 배열
  const [isAdding, setIsAdding] = useState(false);
  const [deletedMenus, setDeletedMenus] = useState<MenuType[]>([]);
  const [hasChanges, setHasChanges] = useState(false); // 변경사항 감지용
  const [initialMenus, setInitialMenus] = useState<MenuType[]>([]);
  const [tempId, setTempId] = useState<number>(-1);


  // 메뉴 상태 갱신 함수 (변경사항 체크 포함)
  const updateMenus = (newMenus: MenuType[]) => {
    setMenus(newMenus);
    setHasChanges(!arraysEqual(newMenus, initialMenus));
  };


  // 추가
  const handleAddMenu = (menu: MenuType) => {
    let uri = menu.uri;

    if (menu.type === 'PAGE') {
      uri = `/page/${encodeURIComponent(menu.name)}`;
    } else if (menu.type === 'CATEGORY') {
      uri = `/category/${encodeURIComponent(menu.name)}`;
    }

    const newMenu = {
      ...menu,
      id: tempId,
      uri,
    };

    setTempId(tempId - 1);
    setMenus([...menus, newMenu]);
    setIsAdding(false);
    setHasChanges(true);
  };

  // 삭제
  const handleDeleteMenu = (id: number) => {
    const deleted = menus.find((menu) => menu.id === id);
    if (deleted) {
      const newMenus = menus.filter((menu) => menu.id !== id);
      updateMenus(newMenus);
      setDeletedMenus([...deletedMenus, deleted]);
    }
  };


  // 순서 변경 등 외부에서 menus 직접 변경시 사용 예시
  const handleMenusChange = (newMenus: MenuType[]) => {
    updateMenus(newMenus);
  };


  useEffect(() => {
    fetch('http://localhost:8080/api/menus?blogId=1')
      .then(res => {
        if (!res.ok) throw new Error('네트워크 응답 에러');
        return res.json();
      })
      .then((data: MenuType[]) => {
        setMenus(data);
        setInitialMenus(data);
      })
      .catch(err => {
      });
  }, []);

  const handleSave = () => {
    console.log('저장할 메뉴들 id:', menus.map(menu => menu.id));

    // 음수 id 제거
    const menusToSave = menus.map(({ id, ...rest }) =>
      id < 0 ? rest : { id, ...rest }
    );

    fetch('http://localhost:8080/api/menus?blogId=1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menusToSave),
    })
      .then(res => {
        if (!res.ok) throw new Error('저장 실패');
        return res.json();
      })
      .then((savedMenus: MenuType[]) => {
        setMenus(savedMenus);
        setInitialMenus(savedMenus);
        setHasChanges(false);
      })
      .catch(err => {
        console.log(menus.map(menu => menu.id));
        console.error(err);
      });
  };



  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between">
            <h1 className="font-semilight flex items-center text-xl text-gray-800">
              메뉴 관리
            </h1>
          </div>
        </div>

        <br />

        <div className="bg-white shadow rounded-xl p-6">
          <MenuList menus={menus} setMenus={handleMenusChange} onDelete={handleDeleteMenu} setHasChanges={setHasChanges} />
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 mt-4 border border-dashed border-gray-400 rounded text-gray-600 hover:bg-gray-50 transition"
              style={{ minHeight: '56px' }}
            >
              + 메뉴 추가
            </button>
          )}
          {isAdding && <AddMenuForm existingMenus={menus} onAdd={handleAddMenu} onCancel={() => setIsAdding(false)} />}
          <hr className="my-6" />
          {deletedMenus.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 border rounded-lg">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">🗑️ 삭제된 메뉴</h2>
              <ul className="text-sm text-gray-500 list-disc list-inside">
                {deletedMenus.map((menu) => (
                  <li key={menu.id}>{menu.name} ({menu.type})</li>
                ))}
              </ul>
            </div>
          )}
          <br />
          <div className="flex justify-end gap-4">
            <button className="border px-4 py-2 rounded cursor-pointer">미리보기</button>
            <button
              className={`px-4 py-2 rounded ${
                hasChanges
                  ? 'bg-blue-600 text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
              disabled={!hasChanges}
              onClick={handleSave}
            >
              변경사항 저장
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default MenuManagerPage;
