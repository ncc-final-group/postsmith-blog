"use client";

import React, { useState } from "react";
import EditHeader from "@components/EditHeader";
import LexicalToolbar from "@components/LexicalToolbar";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { createEditor } from "lexical";

const theme = {
  // 기본 테마: 필요시 커스터마이즈 가능
  paragraph: "mb-2",
  text: "text-black",
};

export default function EditPage() {
  const [title, setTitle] = useState("");
  const editor = createEditor();

  const initialConfig = {
    editor,
    namespace: "PostEditor",
    theme,
    onError: (error: Error) => {
      throw error;
    },
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Lexical에서 에디터 내용 추출 및 저장
    alert(`제목: ${title}\n내용: (에디터 내용은 별도 처리 필요)`);
  };

  return (
    <>
      <EditHeader />
      <LexicalToolbar editor={editor} />
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-6">글 작성</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <LexicalComposer initialConfig={initialConfig}>
            <div className="border border-gray-300 rounded bg-white min-h-[200px] p-2">
              <RichTextPlugin
                contentEditable={<ContentEditable className="min-h-[150px] outline-none text-black" />}
                placeholder={<div className="text-gray-400">내용을 입력하세요</div>}
              />
              <HistoryPlugin />
            </div>
          </LexicalComposer>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            저장
          </button>
        </form>
      </div>
    </>
  );
}
