import React from "react";

// 티스토리 스타일 상단 헤더 (카테고리, 임시저장, 완료 버튼만)
const EditHeader = () => {
  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-white border-b border-gray-200">
      {/* 왼쪽: 카테고리 */}
      <div className="flex items-center gap-4">
        <select className="border border-gray-300 rounded px-2 py-1 text-sm text-black bg-white">
          <option>카테고리</option>
          <option>일상</option>
          <option>개발</option>
          <option>공부</option>
        </select>
      </div>
      {/* 오른쪽: 임시저장/완료 버튼 */}
      <div className="flex items-center gap-2">
        <button className="px-4 py-1 border border-black rounded text-black bg-white hover:bg-gray-100 text-sm">임시저장</button>
        <button className="px-4 py-1 bg-black text-white rounded text-sm">완료</button>
      </div>
    </div>
  );
};

export default EditHeader; 