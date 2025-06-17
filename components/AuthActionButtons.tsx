'use client';

export default function AuthActionButtons() {
  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-800">테스트 액션</h2>
      <div className="flex flex-wrap gap-3">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          onClick={() => window.location.href = '/'}
        >
          홈으로 이동
        </button>
        
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          onClick={() => window.location.reload()}
        >
          페이지 새로고침
        </button>
        
        <button 
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          onClick={() => window.history.back()}
        >
          이전 페이지
        </button>
      </div>
    </div>
  );
} 