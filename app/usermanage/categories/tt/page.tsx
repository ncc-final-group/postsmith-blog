'use client';

import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { TreeItem } from './TreeItem';

export type Category = {
  id: string;
  title: string;
  children: Category[];
};

const sampleData: Category[] = [
  {
    id: '1',
    title: '📁 Root A',
    children: [
      {
        id: '1-1',
        title: '📄 A-1',
        children: [],
      },
      {
        id: '1-2',
        title: '📁 A-2',
        children: [
          {
            id: '1-2-1',
            title: '📄 A-2-1',
            children: [],
          },
          {
            id: '1-2-2',
            title: '📁 A-2-2',
            children: [
              {
                id: '1-2-2-1',
                title: '📄 A-2-2-1',
                children: [],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: '2',
    title: '📁 Root B',
    children: [
      {
        id: '2-1',
        title: '📄 B-1',
        children: [],
      },
    ],
  },
];


// 재귀적으로 항목 제거
function removeItem(tree: Category[], id: string): [Category | null, Category[]] {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) {
      const item = tree[i];
      const newTree = [...tree.slice(0, i), ...tree.slice(i + 1)];
      return [item, newTree];
    }

    const [removed, updatedChildren] = removeItem(tree[i].children, id);
    if (removed) {
      tree[i].children = updatedChildren;
      return [removed, [...tree]];
    }
  }
  return [null, tree];
}

// 재귀적으로 항목 삽입
function insertItem(tree: Category[], targetId: string, item: Category): Category[] {
  return tree.map((node) => {
    if (node.id === targetId) {
      return { ...node, children: [...node.children, item] };
    }
    return { ...node, children: insertItem(node.children, targetId, item) };
  });
}

export default function Page() {
  const [treeData, setTreeData] = useState<Category[]>(sampleData);

  const moveItem = (dragId: string, hoverId: string) => {
    if (dragId === hoverId) return;

    const [removedItem, treeWithoutDragged] = removeItem(treeData, dragId);
    if (!removedItem) return;

    const newTree = insertItem(treeWithoutDragged, hoverId, removedItem);
    setTreeData(newTree);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ fontSize: '18px', padding: '1rem' }}>
        {treeData.map((item) => (
          <TreeItem key={item.id} data={item} moveItem={moveItem} />
        ))}
      </div>
    </DndProvider>
  );
}
