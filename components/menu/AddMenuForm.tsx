import React, { useState } from 'react';
import { MenuType } from './Types';

interface AddMenuFormProps {
  onAdd: (menu: MenuType) => void;
  onCancel: () => void;
  existingMenus: MenuType[];
}

const dummyPages = ['회사소개', '연락처', '이용약관'];
const dummyCategories = ['프론트엔드', '백엔드', '일상'];

const defaultMenus = [
  { name: '홈', uri: '/', key: 'home' },
  { name: '태그', uri: '/tags', key: 'tags' },
  { name: '방명록', uri: '/guestbook', key: 'guestbook' },
];

const AddMenuForm: React.FC<AddMenuFormProps> = ({ onAdd, onCancel, existingMenus }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'DEFAULT' | 'PAGE' | 'CATEGORY' | 'MANUAL'>('MANUAL');
  const [selectedItem, setSelectedItem] = useState('');
  const [uri, setUri] = useState('http://');
  const [isBlank, setIsBlank] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const availableDefaultMenus = defaultMenus.filter(
    (m) => !existingMenus.some((em) => em.type === 'DEFAULT' && em.name === m.name)
  );

  const handleAdd = () => {
    if (type !== 'DEFAULT' && !name.trim()) {
      setErrorMessage('메뉴 이름을 입력해주세요.');
      return;
    }

    if (
      (type === 'DEFAULT' && !selectedItem) ||
      ((type === 'PAGE' || type === 'CATEGORY') && !selectedItem) ||
      (type === 'MANUAL' && !uri.trim())
    ) {
      setErrorMessage('유효한 항목 또는 URI를 선택/입력해주세요.');
      return;
    }

    // 중복 검사 (이름 + 타입 기준)
    const duplicate = existingMenus.some(
      (menu) => menu.name === name.trim() && menu.type === type
    );
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
        <select
          value={selectedItem}
          onChange={(e) => setSelectedItem(e.target.value)}
          className="border rounded p-2 w-1/2"
        >
          {availableDefaultMenus.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-gray-500 p-2 w-1/2">모두 표시 중입니다</div>
      );
    }

    if (type === 'MANUAL') {
      return (
        <input
          type="text"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          className="border rounded p-2 w-1/2"
          placeholder="http://..."
        />
      );
    }

    const list = type === 'PAGE' ? dummyPages : dummyCategories;
    return (
      <select
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)}
        className="border rounded p-2 w-1/2"
      >
        {list.length > 0 ? (
          list.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))
        ) : (
          <option disabled>{type === 'PAGE' ? '페이지 없음' : '카테고리 없음'}</option>
        )}
      </select>
    );
  };

  return (
    <div className="border p-4 rounded-lg bg-gray-50 mt-4">
      {type !== 'DEFAULT' && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="메뉴 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded w-full p-2"
          />
        </div>
      )}

      <div className="flex gap-2 mb-2">
        <select
          value={type}
          onChange={(e) => {
            const newType = e.target.value as typeof type;
            setType(newType);
            if (newType === 'DEFAULT') {
              setSelectedItem(availableDefaultMenus[0]?.key || '');
            } else if (newType === 'PAGE') {
              setSelectedItem(dummyPages[0] || '');
            } else if (newType === 'CATEGORY') {
              setSelectedItem(dummyCategories[0] || '');
            }
          }}
          className="border rounded p-2 w-1/2"
        >
          <option value="DEFAULT">기본 메뉴</option>
          <option value="PAGE">페이지</option>
          <option value="CATEGORY">카테고리</option>
          <option value="MANUAL">직접 입력</option>
        </select>

        {renderSelector()}
      </div>

      <div className="flex items-center mb-3 gap-2">
        <input
          type="checkbox"
          id="isBlank"
          checked={isBlank}
          onChange={(e) => setIsBlank(e.target.checked)}
        />
        <label htmlFor="isBlank">새 창에서 열기</label>
      </div>

      {errorMessage && (
        <div className="text-red-600 text-sm mb-3">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button className="border px-4 py-1 rounded" onClick={onCancel}>
          취소
        </button>
        <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleAdd}>
          추가
        </button>
      </div>
    </div>
  );
};

export default AddMenuForm;
