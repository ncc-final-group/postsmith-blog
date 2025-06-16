'use client';

import React, { useEffect, useRef } from 'react';
import { useDrop } from 'react-dnd';

interface DropZoneProps {
  onDropToRoot: (dragId: number) => void;
}

export function DropZone({ onDropToRoot }: DropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'CATEGORY',
    drop: (dragged: { id: number }, monitor) => {
      if (monitor.didDrop()) return;
      console.log('DropZone drop', dragged.id);
      onDropToRoot(dragged.id);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  useEffect(() => {
    if (ref.current) {
      drop(ref.current);
    }
  }, [drop]);

  return (
    <div
      ref={ref}
      className={`p-4 text-center border-2 border-dashed rounded-md mb-4 ${
        isOver ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-gray-300'
      }`}
    >
      여기로 드롭하면 <strong>루트 카테고리</strong>로 이동합니다
    </div>
  );
}
