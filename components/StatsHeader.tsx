// Header.tsx
import React from 'react';

export default function Header() {
  const getCurrentDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const hours = String(today.getHours()).padStart(2, '0');
    const minutes = String(today.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes} 기준`;
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">방문 통계</h1>
        <div className="text-sm text-gray-500">{getCurrentDateString()}</div>
      </div>
    </div>
  );
}
