'use client';

/* eslint-disable object-curly-newline */

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { createEditor } from 'lexical';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { BLOG_API_URL } from '../../../lib/constants';
import { getSubdomain } from '../../../lib/utils';

import { CustomHRNode } from '@components/CustomHRNode';
import { SpanNode as CCSpanNode } from '@components/CustomSpanNode';
import EditHeader from '@components/EditHeader';
import Editor, { CustomFileNode, CustomImageNode, CustomVideoNode } from '@components/Editor';

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

function PageForm({
  title,
  setTitle,
  slug,
  setSlug,
  showInMenu,
  setShowInMenu,
}: {
  title: string;
  setTitle: (value: string) => void;
  slug: string;
  setSlug: (value: string) => void;
  showInMenu: boolean;
  setShowInMenu: (value: boolean) => void;
}) {
  // 제목이 변경될 때 자동으로 slug 생성
  const generateSlug = (title: string) => {
    return (
      title
        .toLowerCase()
        .trim()
        // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈만 유지)
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        // 연속된 공백을 하나로
        .replace(/\s+/g, ' ')
        // 공백을 하이픈으로 변환
        .replace(/\s/g, '-')
        // 연속된 하이픈을 하나로
        .replace(/-+/g, '-')
        // 앞뒤 하이픈 제거
        .replace(/^-+|-+$/g, '')
    );
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    // 항상 제목에서 자동으로 슬러그 생성
    setSlug(generateSlug(newTitle));
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
          페이지 제목
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
          placeholder="페이지 제목을 입력하세요"
          required
        />
      </div>

      {/* URL 미리보기 */}
      {title && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">페이지 URL 미리보기</label>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <span className="text-sm text-gray-600">/page/</span>
            <span className="text-sm font-medium text-gray-900">{slug}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">✨ 페이지 제목에서 자동으로 생성됩니다</p>
        </div>
      )}

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showInMenu}
            onChange={(e) => setShowInMenu(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">메뉴에 표시</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">체크하면 블로그 메뉴에 이 페이지가 자동으로 추가됩니다.</p>
      </div>
    </div>
  );
}

function SaveButtons({ title, slug, showInMenu }: { title: string; slug: string; showInMenu: boolean }) {
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
      const subdomain = getSubdomain();
      if (!subdomain) {
        alert('블로그 주소를 찾을 수 없습니다. 올바른 블로그 주소로 접속해주세요.');
        return;
      }

      // 슬러그 유효성 검사
      if (!slug || slug.trim() === '') {
        alert('페이지 URL을 입력해주세요.');
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
        title,
        content: html,
        slug: slug.trim(),
        showInMenu, // 메뉴 표시 여부
      };

      // 서버로 POST 요청 (페이지 전용 API 엔드포인트)
      const response = await fetch(`/api/pages`, {
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

      const responseData = await response.json();

      alert('페이지가 성공적으로 저장되었습니다.');

      // 저장 완료 후 생성된 페이지로 이동 (sequence 사용)
      if (responseData.data?.sequence) {
        router.push(`/posts/${responseData.data.sequence}`);
      } else {
        router.push(`/page/${slug}`);
      }
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
      const subdomain = getSubdomain();
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

      const requestBody = {
        title: title || '제목 없음',
        content: html,
        slug: slug || 'untitled',
        type: 'page',
        showInMenu,
        isDraft: true, // 임시 저장 플래그
      };

      // 임시 저장 요청
      const response = await fetch(`${BLOG_API_URL}/${subdomain}/temp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
        <button
          type="button"
          onClick={handleTempSave}
          disabled={isLoading}
          className={`rounded-md px-6 py-2 font-medium transition-colors ${
            isLoading ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-gray-500 text-white hover:bg-gray-600'
          }`}
        >
          {isLoading ? '저장 중...' : '임시 저장'}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className={`rounded-md px-6 py-2 font-medium transition-colors ${
            isLoading ? 'cursor-not-allowed bg-gray-400 text-gray-600' : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isLoading ? '저장 중...' : '페이지 저장'}
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

export default function PageEditor() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [showInMenu, setShowInMenu] = useState(true);

  const initialConfig: InitialConfigType = {
    namespace: 'PageEditor',
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
      // SpanNode,
      CustomHRNode,
      CustomFileNode,
      CustomImageNode,
      CustomVideoNode,
    ],
    onError: (error: Error) => {
      throw error;
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LexicalComposer initialConfig={initialConfig}>
        <ContentSizeMonitor />
        <EditHeader />
        <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="border-b border-green-200 bg-green-50 p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-green-800">📄 정적 페이지 작성</h2>
              <p className="mt-1 text-sm text-green-600">About, Contact 등의 정적 페이지를 생성합니다. 메뉴에 자동으로 추가할 수 있습니다.</p>
            </div>
            <PageForm title={title} setTitle={setTitle} slug={slug} setSlug={setSlug} showInMenu={showInMenu} setShowInMenu={setShowInMenu} />
            <Editor />
            <SaveButtons title={title} slug={slug} showInMenu={showInMenu} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
