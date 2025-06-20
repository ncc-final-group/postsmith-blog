'use client';

/* eslint-disable object-curly-newline */

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { createEditor } from 'lexical';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { BLOG_API_URL } from '../../../lib/constants';

import { CustomHRNode } from '@components/CustomHRNode';
import DraftContentsList from '@components/DraftContentsList';
import EditHeader from '@components/EditHeader';
import Editor from '@components/Editor';
import { CustomFileNode, CustomImageNode, CustomVideoNode } from '@components/nodes';

// 카테고리 타입 정의
interface Category {
  id: number;
  name: string;
  description: string;
  parent_id: number | null;
  type: string;
  sort_order: number;
  post_count: number;
  user_id: number;
}

const theme = {
  // 기본 테마: 필요시 커스터마이즈 가능
  paragraph: 'mb-2',
  heading: {
    h1: 'text-4xl font-bold mb-4',
    h2: 'text-3xl font-bold mb-3',
    h3: 'text-2xl font-bold mb-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    textColor: 'text-black',
    backgroundColor: 'bg-transparent',
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
  },
  list: {
    ul: 'list-disc list-inside pl-4',
    ol: 'list-decimal list-inside pl-4',
    checkbox: 'list-none pl-4',
    dash: 'list-none pl-4',
    arrow: 'list-none pl-4',
    roman: 'list-none pl-4',
  },
  divider: {
    solid: 'my-4 border-t-2 border-black',
    dashed: 'my-4 border-t-2 border-dashed border-black',
    dotted: 'my-4 border-t-2 border-dotted border-black',
    double: 'my-4 border-t-4 border-double border-black',
    thick: 'my-4 border-t-4 border-black',
  },
  // 스타일이 적용된 텍스트를 위한 클래스
  characterStyles: { colored: 'styled-text' },
};

function EditorForm({ category, setCategory, title, setTitle }: { category: string; setCategory: (value: string) => void; title: string; setTitle: (value: string) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      // API Route를 통해 카테고리 가져오기 (subdomain 기반으로 자동 감지)
      const response = await fetch('/api/categories');

      // 블로그가 존재하지 않는 경우 404 처리
      if (response.status === 404) {
        alert('블로그를 찾을 수 없습니다. 올바른 블로그 주소인지 확인해주세요.');
        return;
      }

      const result = await response.json();

      if (result.success && result.data) {
        setCategories(result.data as Category[]);
      } else {
        throw new Error(result.message || 'Failed to fetch categories');
      }
    } catch (error) {
      // 에러 발생시 기본 카테고리 사용
      const fallbackCategories = [
        { id: 1, name: '기술', description: '', parent_id: null, type: 'blog', sort_order: 1, post_count: 0, user_id: 1 },
        { id: 2, name: '일상', description: '', parent_id: null, type: 'blog', sort_order: 2, post_count: 0, user_id: 1 },
        { id: 3, name: '리뷰', description: '', parent_id: null, type: 'blog', sort_order: 3, post_count: 0, user_id: 1 },
        { id: 4, name: '기타', description: '', parent_id: null, type: 'blog', sort_order: 4, post_count: 0, user_id: 1 },
      ];
      setCategories(fallbackCategories);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingCategories}
        >
          <option value="">{isLoadingCategories ? '카테고리 로딩 중...' : '카테고리 선택'}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id.toString()}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          placeholder="제목을 입력하세요"
          required
        />
      </div>
    </div>
  );
}

function SaveButtons({ category, title }: { category: string; title: string }) {
  const [editor] = useLexicalComposerContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 서브도메인 가져오기
      const hostname = window.location.hostname;
      const subdomain = hostname.includes('.') ? hostname.split('.')[0] : null;

      if (!subdomain) {
        alert('블로그 주소를 찾을 수 없습니다. 올바른 블로그 주소로 접속해주세요.');
        return;
      }

      // Lexical editorState에서 HTML 추출
      const editorState = editor.getEditorState();
      let html = '';
      editorState.read(() => {
        html = $generateHtmlFromNodes(editor, null);
      });

      // 에디터 내용이 비어있는지 확인
      if (!html || html === '<p class="mb-2"></p>') {
        alert('내용을 입력해주세요.');
        setIsLoading(false);
        return;
      }

      // 16MB 제한 확인 (15MB로 여유 확보)
      const maxSize = 15 * 1024 * 1024; // 15MB
      const contentSize = new Blob([html]).size;
      if (contentSize > maxSize) {
        alert(`콘텐츠가 너무 큽니다! 최대 15MB까지 허용됩니다.\n현재 크기: ${(contentSize / 1024 / 1024).toFixed(2)}MB\n\n일부 이미지나 파일을 제거해주세요.`);
        setIsLoading(false);
        return;
      }

      // 서브도메인으로 블로그 정보 조회하여 blogId 확보
      const blogResponse = await fetch(`/api/blog?address=${subdomain}`);
      if (!blogResponse.ok) {
        alert('블로그 정보를 가져올 수 없습니다.');
        setIsLoading(false);
        return;
      }
      const blogData = await blogResponse.json();
      const blogId = blogData?.id || blogData?.data?.id;

      if (!blogId) {
        alert('블로그 ID를 찾을 수 없습니다.');
        setIsLoading(false);
        return;
      }

      const requestBody = {
        blogId,
        category: parseInt(category) || 0,
        title,
        content: html,
      };

      // 디버깅을 위한 로그 추가
      // console.log('요청 URL:', `${BLOG_API_URL}/create`);
      // console.log('요청 데이터:', requestBody);

      // 서버로 POST 요청
      const response = await fetch(`/api/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // 응답 로깅
      // console.log('응답 상태:', response.status);
      const responseData = await response.text();
      // console.log('응답 데이터:', responseData);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${responseData}`);
      }

      alert('글이 성공적으로 저장되었습니다.');

      // 저장 완료 후 블로그 메인 페이지로 이동
      router.push(`/`); // 메인 페이지로 이동
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      alert('저장 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTempSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 서브도메인 가져오기
      const hostname = window.location.hostname;
      const subdomain = hostname.includes('.') ? hostname.split('.')[0] : null;

      if (!subdomain) {
        alert('블로그 주소를 찾을 수 없습니다. 올바른 블로그 주소로 접속해주세요.');
        return;
      }

      // 서브도메인으로 블로그 정보 조회하여 blogId 확보
      const blogResponse = await fetch(`/api/blog?address=${subdomain}`);
      if (!blogResponse.ok) {
        alert('블로그 정보를 가져올 수 없습니다.');
        setIsLoading(false);
        return;
      }
      const blogData = await blogResponse.json();
      const blogId = blogData?.id || blogData?.data?.id;

      if (!blogId) {
        alert('블로그 ID를 찾을 수 없습니다.');
        setIsLoading(false);
        return;
      }

      // Lexical editorState에서 HTML 추출
      const editorState = editor.getEditorState();
      let html = '';
      editorState.read(() => {
        html = $generateHtmlFromNodes(editor, null);
      });

      // 에디터 내용이 비어있는지 확인
      if (!html || html === '<p class="mb-2"></p>') {
        alert('내용을 입력해주세요.');
        setIsLoading(false);
        return;
      }

      const requestBody = {
        blogId: blogId,
        category: parseInt(category) || null,
        title: title || '제목 없음',
        content: html,
        postType: 'POSTS',
        isTemp: true, // 임시 저장 플래그
        isPublic: false,
      };

      // 임시 저장 요청
      const response = await fetch('/api/contents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }

      alert('임시 저장 완료!');
    } catch (err) {
      setError(err instanceof Error ? err.message : '임시 저장 중 오류가 발생했습니다.');
      alert('임시 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4">
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      {/* 버튼 영역 */}
      <div className="flex justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleTempSave}
            disabled={isLoading}
            className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
              isLoading ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            {isLoading ? '저장 중...' : '임시 저장'}
          </button>
          <DraftContentsList contentType="POSTS" />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${
            isLoading ? 'cursor-not-allowed bg-gray-400 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

function ContentSizeMonitor() {
  const [editor] = useLexicalComposerContext();
  const [contentSize, setContentSize] = useState(0);

  // 콘텐츠 크기 모니터링
  useEffect(() => {
    const updateContentSize = () => {
      editor.getEditorState().read(() => {
        const html = $generateHtmlFromNodes(editor, null);
        const sizeInBytes = new Blob([html]).size;
        setContentSize(sizeInBytes);
      });
    };

    // 에디터 변경 시마다 크기 업데이트
    const removeListener = editor.registerUpdateListener(() => {
      updateContentSize();
    });

    // 초기 크기 설정
    updateContentSize();

    return () => {
      removeListener();
    };
  }, [editor]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white px-4 py-3">
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-600">콘텐츠 크기:</span>
          <span className={`font-mono ${contentSize > 15 * 1024 * 1024 ? 'font-bold text-red-600' : contentSize > 12 * 1024 * 1024 ? 'text-orange-500' : 'text-green-600'}`}>
            {formatFileSize(contentSize)} / 15MB
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              contentSize > 15 * 1024 * 1024 ? 'bg-red-500' : contentSize > 12 * 1024 * 1024 ? 'bg-orange-400' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((contentSize / (15 * 1024 * 1024)) * 100, 100)}%` }}
          ></div>
        </div>
        {contentSize > 12 * 1024 * 1024 && contentSize <= 15 * 1024 * 1024 && (
          <p className="mt-2 text-xs text-orange-600">⚠️ 콘텐츠 크기가 80%를 초과했습니다. 일부 파일을 제거하는 것을 고려해보세요.</p>
        )}
        {contentSize > 15 * 1024 * 1024 && <p className="mt-2 text-xs text-red-600">🚫 콘텐츠 크기가 한계를 초과했습니다! 저장하기 전에 크기를 줄여주세요.</p>}
      </div>
    </div>
  );
}

export default function PostEditor() {
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');

  const initialConfig = {
    namespace: 'PostEditor',
    theme,
    nodes: [
      ListNode,
      ListItemNode,
      HeadingNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      LinkNode,
      CustomHRNode,
      CustomFileNode,
      CustomImageNode,
      CustomVideoNode,
    ],
    onError: (error: Error) => {},
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LexicalComposer initialConfig={initialConfig}>
        <ContentSizeMonitor />
        <EditHeader />
        <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <EditorForm category={category} setCategory={setCategory} title={title} setTitle={setTitle} />
            <Editor />
            <SaveButtons category={category} title={title} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
