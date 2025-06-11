'use client';

import { useDrag, useDrop } from 'react-dnd';

import type { Category } from './page'
import { useState } from 'react';

type TreeItemProps = {
  data: Category;
  moveItem: (dragId: string, hoverId: string) => void;
};

export function TreeItem({ data, moveItem }: TreeItemProps) {

  const [isOver, setIsOver] = useState(false);


  const [{ isDragging }, dragRef] = useDrag({
    type: 'TREE_ITEM',
    item: { id: data.id },
    collect: (monitor) => ({isDragging: monitor.isDragging(),}),
  });

  const [, dropRef] = useDrop({
    accept: 'TREE_ITEM',
    hover: (item: { id: string }) => {
      if (item.id !== data.id) {
        setIsOver(true);
      }
    },
    drop: (item: { id: string }) => {
      if (item.id !== data.id) {
        moveItem(item.id, data.id);
      }
      setIsOver(false);
    },
    collect: (monitor) => ({isOver: monitor.isOver(), }),
  });

  const combinedRef = (node: HTMLDivElement | null) => {
    dragRef(dropRef(node));
  };

  return (
    <div
      ref={combinedRef}
      style={{
        marginLeft: 20,
        padding: '6px 10px',
        border: isOver ? '2px dashed #4f46e5' : '1px solid #ccc',
        backgroundColor: isOver ? '#eef2ff' : 'transparent',
        opacity: isDragging ? 0.5 : 1,
        borderRadius: '4px',
        cursor: 'move',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {data.title}
      {data.children.map((child) => (
        <TreeItem key={child.id} data={child} moveItem={moveItem} />
      ))}
    </div>
  );
}
