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
import { CustomHRNode } from "./CustomHRNode";
import { $createParagraphNode, $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_LOW, createCommand, KEY_BACKSPACE_COMMAND, TextNode } from 'lexical';
import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { CodeHighlightNode, CodeNode } from "@lexical/code";

// 색상 변경 명령어 생성
export const SET_TEXT_COLOR_COMMAND = createCommand('SET_TEXT_COLOR_COMMAND');
export const SET_BG_COLOR_COMMAND = createCommand('SET_BG_COLOR_COMMAND');

function OnChange() {
  const [editor] = useLexicalComposerContext();
  
  return (
    <OnChangePlugin
      onChange={(editorState) => {
        editorState.read(() => {
          const selection = editor.getEditorState()._selection;
          
          if (selection) {
            // Selection changed
          }
        });
      }}
    />
  );
}

function HRKeyboardPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();
        
        // 빈 paragraph에서 backspace를 누른 경우
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          if (anchor.offset === 0) {
            const currentNode = anchor.getNode();
            
            // 현재 노드가 빈 paragraph인지 확인
            if ($isParagraphNode(currentNode) && currentNode.getTextContent().length === 0) {
              const prevSibling = currentNode.getPreviousSibling();
              
              // 이전 노드가 HR인 경우
              if (prevSibling instanceof CustomHRNode) {
                prevSibling.remove();
                return true;
              }
            }
          }
        }
        
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

function ColorPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    // 텍스트 색상 변경 명령어 등록
    editor.registerCommand(
      SET_TEXT_COLOR_COMMAND,
      (color: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          // 선택된 텍스트가 있는 경우
          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            nodes.forEach((node) => {
              if ($isTextNode(node)) {
                const text = node.getTextContent();
                const textNode = $createTextNode(text);
                textNode.setStyle(`color: ${color}`);
                node.replace(textNode);
              }
            });
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    // 배경색 변경 명령어 등록
    editor.registerCommand(
      SET_BG_COLOR_COMMAND,
      (color: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          // 선택된 텍스트가 있는 경우
          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            nodes.forEach((node) => {
              if ($isTextNode(node)) {
                const text = node.getTextContent();
                const textNode = $createTextNode(text);
                textNode.setStyle(`background-color: ${color}`);
                node.replace(textNode);
              }
            });
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

// 에디터 스타일 정의
const theme = {
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
  },
  list: {
    ul: 'list-disc list-inside pl-4',
  },
  // 스타일이 적용된 텍스트를 위한 클래스
  characterStyles: {
    colored: 'styled-text',
  },
};

const editorConfig = {
  namespace: 'MyEditor',
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
    console.error(error);
  },
};

export { CustomHRNode };

export default function Editor() {
  return (
    <div className="border border-gray-300 rounded bg-white">
      <div className="p-2">
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="min-h-[150px] outline-none text-black prose max-w-none" 
            />
          }
          placeholder={<div className="text-gray-400">내용을 입력하세요</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <OnChange />
        <HRKeyboardPlugin />
        <ColorPlugin />
      </div>
    </div>
  );
} 