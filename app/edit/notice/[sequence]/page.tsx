'use client';

/* eslint-disable object-curly-newline */

import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $generateNodesFromDOM } from '@lexical/html';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { $getRoot } from 'lexical';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { BLOG_API_URL } from '../../../../lib/constants';

import { CustomHRNode } from '@components/CustomHRNode';
import DraftContentsList from '@components/DraftContentsList';
import EditHeader from '@components/EditHeader';
import Editor from '@components/Editor';
import { CustomFileNode, CustomImageNode, CustomVideoNode } from '@components/nodes';

// 콘텐츠 타입 정의
interface Content {
  id: number;
  sequence: number;
  title: string;
  content_html: string;
  category_id: number | null;
  type: string;
  is_public: boolean;
  is_temp: boolean;
  blog_id: number;
  created_at: string;
  updated_at: string;
  is_important?: boolean;
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

function EditorContentLoader({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content && content !== '<p class="mb-2"></p>') {
      editor.update(() => {
        // HTML을 DOM으로 파싱
        const parser = new DOMParser();
        const dom = parser.parseFromString(content, 'text/html');

        // DOM에서 Lexical 노드 생성
        const nodes = $generateNodesFromDOM(editor, dom);

        // 에디터의 루트 노드 가져오기
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
      });
    }
  }, [editor, content]);

  return null;
}

function NoticeForm({
  title,
  setTitle,
  isImportant,
  setIsImportant,
  content,
}: {
  title: string;
  setTitle: (value: string) => void;
  isImportant: boolean;
  setIsImportant: (value: boolean) => void;
  content: Content | null;
}) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-red-500"
          placeholder="공지사항 제목을 입력하세요"
          required
        />
      </div>
      <div className="mb-4">
        <label className="flex items-center">
          <input type="checkbox" checked={isImportant} onChange={(e) => setIsImportant(e.target.checked)} className="mr-2" />
          <span className="text-sm text-gray-700">중요 공지사항</span>
        </label>
        <p className="mt-1 text-xs text-gray-500">중요 공지사항으로 설정하면 목록 상단에 표시됩니다.</p>
      </div>
    </div>
  );
}

function SaveButtons({ title, isImportant, sequence, isUpdate, content }: { title: string; isImportant: boolean; sequence: number; isUpdate: boolean; content: Content | null }) {
  const [editor] = useLexicalComposerContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const router = useRouter();

  // 기존 content의 is_public 상태를 기반으로 초기값 설정
  useEffect(() => {
    if (content) {
      setIsPrivate(!content.is_public);
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
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

      const requestBody = {
        category: null,
        title,
        content: html,
        isImportant,
        postType: 'NOTICE',
        isTemp: false,
        isPublic: !isPrivate, // 비공개 설정 반영
      };

      // 수정 요청
      const response = await fetch(`/api/contents/${sequence}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }

      alert('공지사항이 성공적으로 수정되었습니다.');

      // 수정 완료 후 해당 공지사항으로 이동
      router.push(`/posts/${sequence}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTempSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Lexical editorState에서 HTML 추출
      const editorState = editor.getEditorState();
      let html = '';
      editorState.read(() => {
        html = $generateHtmlFromNodes(editor, null);
      });

      const requestBody = {
        category: null,
        title: title || '제목 없음',
        content: html,
        isImportant,
        postType: 'NOTICE',
        isTemp: true, // 임시 저장 플래그
        isPublic: false,
      };

      // 임시 저장 요청 (수정 모드에서도 PUT 사용)
      const response = await fetch(`/api/contents/${sequence}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
          <DraftContentsList contentType="NOTICE" />
        </div>

        <div className="flex items-center gap-4">
          {/* 비공개 글 체크박스 */}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
            비공개 공지사항
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`rounded-md px-6 py-2 text-sm font-medium transition-colors ${isLoading ? 'cursor-not-allowed bg-gray-400 text-gray-600' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            {isLoading ? '수정 중...' : '공지사항 수정'}
          </button>
        </div>
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

export default function NoticeEditPage({ params }: { params: Promise<{ sequence: string }> }) {
  const [title, setTitle] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sequence, setSequence] = useState<number>(0);

  // 기존 공지사항 데이터 불러오기
  useEffect(() => {
    const loadContent = async () => {
      try {
        setIsLoading(true);
        const resolvedParams = await params;
        const sequenceNum = parseInt(resolvedParams.sequence);

        if (isNaN(sequenceNum)) {
          setError('유효하지 않은 공지사항 ID입니다.');
          return;
        }

        setSequence(sequenceNum);

        const response = await fetch(`/api/contents/${sequenceNum}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('공지사항을 찾을 수 없습니다.');
          } else {
            setError('공지사항을 불러오는 중 오류가 발생했습니다.');
          }
          return;
        }

        const result = await response.json();

        if (result.success && result.data) {
          const contentData = result.data as Content;

          // NOTICE 타입인지 확인
          if (contentData.type !== 'NOTICE') {
            setError('이 콘텐츠는 공지사항이 아닙니다.');
            return;
          }

          setContent(contentData);
          setTitle(contentData.title || '');
          setIsImportant(contentData.is_important ?? false);
        } else {
          setError('공지사항을 불러올 수 없습니다.');
        }
      } catch (err) {
        setError('공지사항을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [params]);

  const initialConfig = {
    namespace: 'NoticeEditor',
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-red-600"></div>
          <p className="text-gray-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-xl text-red-600">오류 발생</div>
          <p className="mb-4 text-gray-600">{error}</p>
          <button onClick={() => window.history.back()} className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LexicalComposer initialConfig={initialConfig}>
        <ContentSizeMonitor />
        {content && <EditorContentLoader content={content.content_html || ''} />}
        <EditHeader />
        <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <NoticeForm title={title} setTitle={setTitle} isImportant={isImportant} setIsImportant={setIsImportant} content={content} />
            <Editor />
            <SaveButtons title={title} isImportant={isImportant} sequence={sequence} isUpdate={true} content={content} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
