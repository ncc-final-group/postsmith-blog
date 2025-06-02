"use client";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { $generateHtmlFromNodes } from "@lexical/html";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { createEditor } from "lexical";
import React, { useState } from "react";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";

import EditHeader from "@components/EditHeader";
import Editor, { CustomHRNode } from "@components/Editor";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const theme = {
  // 기본 테마: 필요시 커스터마이즈 가능
  paragraph: "mb-2",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    textColor: "text-black",
    backgroundColor: "bg-transparent",
    left: "text-left",
    center: "text-center",
    right: "text-right",
    justify: "text-justify",
  },
  list: {
    ul: "list-disc list-inside pl-4",
    ol: "list-decimal list-inside pl-4"
  },
  divider: {
    solid: "my-4 border-t-2 border-black",
    dashed: "my-4 border-t-2 border-dashed border-black",
    dotted: "my-4 border-t-2 border-dotted border-black",
    double: "my-4 border-t-4 border-double border-black",
    thick: "my-4 border-t-4 border-black"
  }
};

function EditorForm({ category, setCategory, title, setTitle }: {
  category: string;
  setCategory: (value: string) => void;
  title: string;
  setTitle: (value: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Lexical editorState에서 HTML 추출
      const editorState = editor.getEditorState();
      let html = "";
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
        category: 0,
        title,
        content: html,
      };

      // 요청 내용 확인
      alert('Request Body: ' + JSON.stringify(requestBody, null, 2));

      // 서버로 POST 요청
      const response = await fetch("http://localhost:8080/api1/post/test/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert("저장 완료!");
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
      alert('저장 중 오류가 발생했습니다. 서버 연결을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <select
        className="w-1/2 border border-gray-300 rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
        value={category}
        onChange={e => setCategory(e.target.value)}
        required
      >
        <option value="">카테고리를 선택하세요</option>
        <option value="일상">일상</option>
        <option value="개발">개발</option>
        <option value="공부">공부</option>
      </select>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Editor />
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
        disabled={isLoading}
      >
        {isLoading ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}

export default function EditPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  const initialConfig = {
    namespace: "PostEditor",
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
    ],
    onError: (error: Error) => {
      throw error;
    },
  };

  return (
    <div className="bg-white">
      <LexicalComposer initialConfig={initialConfig}>
        <EditHeader />
        <div className="max-w-3xl mx-auto py-10 px-4">
          <EditorForm
            category={category}
            setCategory={setCategory}
            title={title}
            setTitle={setTitle}
          />
        </div>
      </LexicalComposer>
      <footer className="sticky bottom-0 w-full bg-white border-t border-gray-200 px-4 py-2 flex justify-end gap-2 z-10">
        <button className="px-4 py-1 border border-black rounded text-black bg-white hover:bg-gray-100 text-sm">임시저장</button>
        <button className="px-4 py-1 bg-black text-white rounded text-sm">완료</button>
      </footer>
    </div>
  );
}
