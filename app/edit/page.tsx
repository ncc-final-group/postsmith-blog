'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EditSelectPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('');

  const contentTypes = [
    {
      id: 'post',
      title: '블로그 포스트',
      description: '일반적인 블로그 글을 작성합니다. 카테고리를 선택할 수 있습니다.',
      icon: '📝',
      color: 'blue',
      path: '/edit/post',
    },
    {
      id: 'notice',
      title: '공지사항',
      description: '중요한 공지사항을 작성합니다. 블로그 상단에 고정 표시됩니다.',
      icon: '📢',
      color: 'red',
      path: '/edit/notice',
    },
    {
      id: 'page',
      title: '정적 페이지',
      description: 'About, Contact 등의 정적 페이지를 생성합니다. 메뉴에 추가할 수 있습니다.',
      icon: '📄',
      color: 'green',
      path: '/edit/page',
    },
  ];

  const handleTypeSelect = (type: string) => {
    const selectedContent = contentTypes.find((ct) => ct.id === type);
    if (selectedContent) {
      router.push(selectedContent.path);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
    case 'blue':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-200 hover:border-blue-300',
        text: 'text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700',
      };
    case 'red':
      return {
        bg: 'bg-red-50 hover:bg-red-100',
        border: 'border-red-200 hover:border-red-300',
        text: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700',
      };
    case 'green':
      return {
        bg: 'bg-green-50 hover:bg-green-100',
        border: 'border-green-200 hover:border-green-300',
        text: 'text-green-800',
        button: 'bg-green-600 hover:bg-green-700',
      };
    default:
      return {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-200 hover:border-gray-300',
        text: 'text-gray-800',
        button: 'bg-gray-600 hover:bg-gray-700',
      };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">콘텐츠 작성</h1>
          <p className="mt-2 text-gray-600">작성하고 싶은 콘텐츠 유형을 선택해주세요.</p>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {contentTypes.map((type) => {
            const colors = getColorClasses(type.color);
            return (
              <div
                key={type.id}
                className={`cursor-pointer rounded-lg border-2 p-6 transition-all duration-200 ${colors.bg} ${colors.border}`}
                onClick={() => handleTypeSelect(type.id)}
              >
                <div className="text-center">
                  <div className="mb-4 text-4xl">{type.icon}</div>
                  <h3 className={`mb-3 text-xl font-semibold ${colors.text}`}>{type.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-gray-600">{type.description}</p>
                  <button
                    className={`w-full rounded-md px-4 py-2 font-medium text-white transition-colors ${colors.button}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTypeSelect(type.id);
                    }}
                  >
                    작성하기
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 추가 정보 */}
        <div className="mt-12 rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">💡 작성 팁</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-sm">
              <h3 className="mb-2 font-medium text-blue-800">📝 블로그 포스트</h3>
              <p className="text-gray-600">일상, 기술, 리뷰 등 다양한 주제의 글을 작성할 수 있습니다. 카테고리별로 정리됩니다.</p>
            </div>
            <div className="text-sm">
              <h3 className="mb-2 font-medium text-red-800">📢 공지사항</h3>
              <p className="text-gray-600">중요한 알림이나 공지사항을 작성합니다. 블로그 상단에 고정되어 표시됩니다.</p>
            </div>
            <div className="text-sm">
              <h3 className="mb-2 font-medium text-green-800">📄 정적 페이지</h3>
              <p className="text-gray-600">소개, 연락처 등의 고정 페이지를 만듭니다. 블로그 메뉴에 추가할 수 있습니다.</p>
            </div>
          </div>
        </div>

        {/* 빠른 액세스 */}
        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-gray-500">빠른 액세스</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => router.push('/edit/post')} className="rounded-md bg-blue-100 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-200">
              포스트 작성
            </button>
            <button onClick={() => router.push('/edit/notice')} className="rounded-md bg-red-100 px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-200">
              공지사항 작성
            </button>
            <button onClick={() => router.push('/edit/page')} className="rounded-md bg-green-100 px-4 py-2 text-sm text-green-700 transition-colors hover:bg-green-200">
              페이지 작성
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
