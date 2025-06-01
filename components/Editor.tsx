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
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { LinkNode } from "@lexical/link";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

function OnChange() {
  const [editor] = useLexicalComposerContext();
  
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          const selection = editor.getEditorState()._selection;
          if (selection) {
            console.log('Selection changed');
          }
        });
      }}
    />
  );
}

export default function Editor() {
  return (
    <div className="border border-gray-300 rounded bg-white">
      <div className="p-2">
        <RichTextPlugin
          contentEditable={<ContentEditable className="min-h-[150px] outline-none text-black" />}
          placeholder={<div className="text-gray-400">내용을 입력하세요</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <OnChange />
      </div>
    </div>
  );
} 