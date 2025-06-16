import { GripVertical } from 'lucide-react';
import React, { useRef } from 'react';
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';

import { DragItem, MenuType } from './Types';




interface MenuItemProps {
  menu: MenuType;
  index: number;
  moveMenu: (dragIndex: number, hoverIndex: number) => void;
  onDelete: (id: number) => void;
}

const MenuItem = ({ menu, index, moveMenu, onDelete } : MenuItemProps) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: 'MENU',
    item: { id: menu.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging(),}),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: 'MENU',
    drop(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      moveMenu(dragIndex, hoverIndex);
    },
    collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }),}),
  });

  drag(drop(ref)); // drag & drop 적용

  return (
    <div
      ref={ref}
      className={`
        p-4 border rounded flex justify-between items-center mb-3 bg-white shadow-sm transition
        ${isDragging ? 'opacity-50 ring-2 ring-blue-400' : ''}
        ${isOver && !isDragging ? 'bg-blue-50' : ''}
      `}
      style={{ minHeight: '56px' }} // 세로 높이 조절 (기존보다 약간 더 크게)
    >
      <div className="flex items-center gap-2">
        <GripVertical className="text-gray-400 cursor-move" />
        <span>{menu.name}</span>
        <span className="text-xs text-gray-400">({menu.type})</span>
      </div>
      <button onClick={() => onDelete(menu.id)} className="text-red-500">
          🗑️
      </button>
      
    </div>
  );
};

export default MenuItem;
