import React, { useState } from 'react';

import MenuItem from './MenuItem';
import { MenuType } from './Types';

interface Props {
  menus: MenuType[];
  setMenus: (menus: MenuType[]) => void;
  onDelete: (id: number) => void;
  setHasChanges: (v: boolean) => void; // ✅ 추가
}

const MenuList: React.FC<Props> = ({ menus, setMenus, onDelete }) => {
  const [hasChanges, setHasChanges] = useState(false); // 변경사항 감지용

  const moveMenu = (dragIndex: number, hoverIndex: number) => {
    const updatedMenus = [...menus];
    const [removed] = updatedMenus.splice(dragIndex, 1);
    updatedMenus.splice(hoverIndex, 0, removed);
    setMenus(updatedMenus);
    setHasChanges(true); // ✅ 변경사항 있음 표시
  };

  return (
    <div>
      {menus.map((menu, index) => (
        <MenuItem key={menu.id} menu={menu} index={index} moveMenu={moveMenu} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default MenuList;
