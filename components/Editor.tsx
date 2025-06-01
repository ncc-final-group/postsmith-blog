import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";

function OnChange() {
  const [editor] = useLexicalComposerContext();
  
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          // 에디터 상태가 변경될 때마다 실행
          const selection = editor.getEditorState()._selection;
          if (selection) {
            const format = selection.format;
            console.log('현재 선택된 텍스트의 서식:', {
              bold: format & 1 ? '굵게' : '일반',
              italic: format & 2 ? '기울임' : '일반',
              underline: format & 4 ? '밑줄' : '일반',
            });
          }
        });
      }}
    />
  );
}

export default function Editor() {
  return (
    <div className="border border-gray-300 rounded bg-white min-h-[200px] p-2">
      <RichTextPlugin
        contentEditable={<ContentEditable className="min-h-[150px] outline-none text-black" />}
        placeholder={<div className="text-gray-400">내용을 입력하세요</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <AutoFocusPlugin />
      <ClearEditorPlugin />
      <OnChange />
    </div>
  );
} 