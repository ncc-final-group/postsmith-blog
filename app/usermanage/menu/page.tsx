'use client';

import { Edit, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Types
interface Menu {
  id: number;
  name: string;
  type: string;
  uri: string;
  is_blank: boolean;
}

interface MenuData {
  menus: Menu[];
  totalCount: number;
}

export default function MenuManagePage() {
  const [menuData, setMenuData] = useState<MenuData>({
    menus: [],
    totalCount: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'link',
    uri: '',
    is_blank: false,
  });

  // 메뉴 목록 로드
  const loadMenus = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 API 호출로 교체
      const mockMenus: Menu[] = [
        { id: 1, name: '홈', type: 'link', uri: '/', is_blank: false },
        { id: 2, name: '소개', type: 'link', uri: '/about', is_blank: false },
        { id: 3, name: '연락처', type: 'link', uri: '/contact', is_blank: false },
        { id: 4, name: 'GitHub', type: 'link', uri: 'https://github.com', is_blank: true },
      ];

      setMenuData({
        menus: mockMenus,
        totalCount: mockMenus.length,
      });
    } catch (error) {
      // 메뉴 로드 실패 처리
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const handleAddMenu = () => {
    setEditingMenu(null);
    setFormData({ name: '', type: 'link', uri: '', is_blank: false });
    setShowAddForm(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      type: menu.type,
      uri: menu.uri,
      is_blank: menu.is_blank,
    });
    setShowAddForm(true);
  };

  const handleDeleteMenu = async (menu: Menu) => {
    if (confirm(`정말 "${menu.name}" 메뉴를 삭제하시겠습니까?`)) {
      try {
        // TODO: 실제 API 호출로 교체
        setMenuData((prev) => ({
          ...prev,
          menus: prev.menus.filter((m) => m.id !== menu.id),
          totalCount: prev.totalCount - 1,
        }));
      } catch (error) {
        // 메뉴 삭제 실패 처리
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMenu) {
        // 수정
        const updatedMenu = { ...editingMenu, ...formData };
        setMenuData((prev) => ({
          ...prev,
          menus: prev.menus.map((m) => (m.id === editingMenu.id ? updatedMenu : m)),
        }));
      } else {
        // 추가
        const newMenu: Menu = {
          id: Date.now(), // 임시 ID
          ...formData,
        };
        setMenuData((prev) => ({
          ...prev,
          menus: [...prev.menus, newMenu],
          totalCount: prev.totalCount + 1,
        }));
      }
      setShowAddForm(false);
      setEditingMenu(null);
    } catch (error) {
      // 메뉴 저장 실패 처리
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingMenu(null);
    setFormData({ name: '', type: 'link', uri: '', is_blank: false });
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-none">
        <div className="flex items-center justify-between">
          <h1 className="font-semilight flex items-center text-xl text-gray-800">
            메뉴 관리
            <span className="ml-1 rounded-full bg-gray-100 text-sm font-normal text-gray-500">{menuData.totalCount}</span>
          </h1>
          <button onClick={handleAddMenu} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            메뉴 추가
          </button>
        </div>
      </div>

      {/* 메뉴 추가/수정 폼 */}
      {showAddForm && (
        <div className="mb-6 rounded-lg border border-gray-300 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">{editingMenu ? '메뉴 수정' : '새 메뉴 추가'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">메뉴명</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="메뉴 이름을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">타입</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="link">링크</option>
                  <option value="category">카테고리</option>
                  <option value="page">페이지</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <input
                type="text"
                value={formData.uri}
                onChange={(e) => setFormData((prev) => ({ ...prev, uri: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="URL을 입력하세요 (예: /about, https://example.com)"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_blank"
                checked={formData.is_blank}
                onChange={(e) => setFormData((prev) => ({ ...prev, is_blank: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_blank" className="ml-2 text-sm text-gray-700">
                새 창에서 열기
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                {editingMenu ? '수정' : '추가'}
              </button>
              <button type="button" onClick={handleCancel} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 메뉴 목록 */}
      <div className="max-w-none pt-1">
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">로딩 중...</p>
            </div>
          ) : menuData.menus.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>등록된 메뉴가 없습니다.</p>
            </div>
          ) : (
            menuData.menus.map((menu, index) => (
              <div
                key={menu.id}
                className={`relative border-b border-gray-200 p-4 transition-colors duration-150 hover:bg-gray-50 ${index === menuData.menus.length - 1 ? 'border-b-0' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-gray-900">{menu.name}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">{menu.type}</span>
                      {menu.is_blank && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">새 창</span>}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">{menu.uri}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditMenu(menu)} className="rounded p-1 hover:bg-gray-200" title="수정">
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button onClick={() => handleDeleteMenu(menu)} className="rounded p-1 hover:bg-gray-200" title="삭제">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
