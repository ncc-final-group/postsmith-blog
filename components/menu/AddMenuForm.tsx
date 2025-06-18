import React, { useState } from 'react';

import { MenuType } from './Types';

interface CategoryOption {
  id: number;
  name: string;
}

interface PageOption {
  id: number;
  title: string;
}

interface AddMenuFormProps {
  onAdd: (menu: MenuType) => void;
  onCancel: () => void;
  existingMenus: MenuType[];
  categories: CategoryOption[];
  pages: PageOption[];
}

function isPageOption(item: any): item is PageOption {
  return item && typeof item.id === 'number' && typeof item.title === 'string';
}

function isCategoryOption(item: any): item is CategoryOption {
  return item && typeof item.id === 'number' && typeof item.name === 'string';
}

type pageOption = { id: number; title: string };
type categoryOption = { id: number; name: string };

const defaultMenus = [
  { name: '홈', uri: '/', key: 'home' },
  { name: '태그', uri: '/tags', key: 'tags' },
  { name: '방명록', uri: '/guestbook', key: 'guestbook' },
];

const AddMenuForm: React.FC<AddMenuFormProps> = ({ onAdd, onCancel, existingMenus, categories, pages }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'DEFAULT' | 'PAGE' | 'CATEGORY' | 'MANUAL'>('MANUAL');
  const [selectedItem, setSelectedItem] = useState('');
  const [uri, setUri] = useState('http://');
  const [isBlank, setIsBlank] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const availableDefaultMenus = defaultMenus.filter((m) => !existingMenus.some((em) => em.type === 'DEFAULT' && em.name === m.name));

  const handleAdd = () => {
    if (type !== 'DEFAULT' && !name.trim()) {
      setErrorMessage('메뉴 이름을 입력해주세요.');
      return;
    }

    if ((type === 'DEFAULT' && !selectedItem) || ((type === 'PAGE' || type === 'CATEGORY') && !selectedItem) || (type === 'MANUAL' && !uri.trim())) {
      setErrorMessage('유효한 항목 또는 URI를 선택/입력해주세요.');
      return;
    }

    // 중복 검사 (이름 + 타입 기준)
    const duplicate = existingMenus.some((menu) => menu.name === name.trim() && menu.type === type);
    if (duplicate) {
      setErrorMessage('이미 같은 이름과 유형의 메뉴가 존재합니다.');
      return;
    }

    // URI 유효성 검사 (MANUAL 타입일 때)
    if (type === 'MANUAL') {
      try {
        new URL(uri); // 유효한 URL 형식인지 검사
      } catch {
        setErrorMessage('유효하지 않은 URL입니다.');
        return;
      }
    }

    // URI 세팅
    let finalUri = '';
    let finalName = name;

    if (type === 'DEFAULT') {
      const selected = defaultMenus.find((m) => m.key === selectedItem);
      if (!selected) return setErrorMessage('기본 메뉴 선택이 잘못되었습니다.');
      finalUri = selected.uri;
      finalName = selected.name;
    } else if (type === 'PAGE') {
      finalUri = `/page/${encodeURIComponent(selectedItem)}`;
    } else if (type === 'CATEGORY') {
      finalUri = `/category/${encodeURIComponent(selectedItem)}`;
    } else {
      finalUri = uri;
    }

    if (!finalUri) {
      setErrorMessage('유효한 URI 또는 항목을 선택해주세요.');
      return;
    }

    onAdd({
      id: -Math.floor(Math.random() * 1000000), // 임시 음수 ID
      name: finalName,
      type,
      uri: finalUri,
      isBlank,
      isDefault: type === 'DEFAULT',
    });
  };

  const renderSelector = () => {
    if (type === 'DEFAULT') {
      return availableDefaultMenus.length > 0 ? (
        <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-1/2 rounded border p-2">
          {availableDefaultMenus.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="w-1/2 p-2 text-gray-500">모두 표시 중입니다</div>
      );
    }

    if (type === 'MANUAL') {
      return <input type="text" value={uri} onChange={(e) => setUri(e.target.value)} className="w-1/2 rounded border p-2" placeholder="http://..." />;
    }

    const list: (PageOption | CategoryOption)[] = type === 'PAGE' ? pages : categories;
    return (
      <select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} className="w-1/2 rounded border p-2">
        {list.length > 0 ? (
          list.map((item, index) => {
            if (type === 'PAGE' && isPageOption(item)) {
              return (
                <option key={`page-${item.id}`} value={item.id.toString()}>
                  {item.title}
                </option>
              );
            } else if (isCategoryOption(item)) {
              return (
                <option key={`category-${item.id}`} value={item.name}>
                  {item.name}
                </option>
              );
            } else if (typeof item === 'string') {
              return (
                <option key={`string-${index}`} value={item}>
                  {item}
                </option>
              );
            } else {
              return null; // 예상하지 못한 타입일 경우 안전하게 렌더링하지 않음
            }
          })
        ) : (
          <option disabled>{type === 'PAGE' ? '페이지 없음' : '카테고리 없음'}</option>
        )}
      </select>
    );
  };

  return (
    <div className="mt-4 rounded-lg border bg-gray-50 p-4">
      {type !== 'DEFAULT' && (
        <div className="mb-2">
          <input type="text" placeholder="메뉴 이름" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded border p-2" />
        </div>
      )}

      <div className="mb-2 flex gap-2">
        <select
          value={type}
          onChange={(e) => {
            const newType = e.target.value as typeof type;
            setType(newType);
            if (newType === 'DEFAULT') {
              setSelectedItem(availableDefaultMenus[0]?.key || '');
            } else if (newType === 'PAGE') {
              setSelectedItem(pages[0]?.id?.toString() || '');
            } else if (newType === 'CATEGORY') {
              setSelectedItem(categories[0]?.name || '');
            }
          }}
          className="w-1/2 rounded border p-2"
        >
          <option value="DEFAULT">기본 메뉴</option>
          <option value="PAGE">페이지</option>
          <option value="CATEGORY">카테고리</option>
          <option value="MANUAL">직접 입력</option>
        </select>

        {renderSelector()}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <input type="checkbox" id="isBlank" checked={isBlank} onChange={(e) => setIsBlank(e.target.checked)} />
        <label htmlFor="isBlank">새 창에서 열기</label>
      </div>

      {errorMessage && <div className="mb-3 text-sm text-red-600">{errorMessage}</div>}

      <div className="flex justify-end gap-2">
        <button className="rounded border px-4 py-1" onClick={onCancel}>
          취소
        </button>
        <button className="rounded bg-blue-600 px-4 py-1 text-white" onClick={handleAdd}>
          추가
        </button>
      </div>
    </div>
  );
};

export default AddMenuForm;
