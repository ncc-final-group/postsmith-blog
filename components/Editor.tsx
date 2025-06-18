'use client';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode, ListItemNode, ListNode } from '@lexical/list';
import { TRANSFORMERS } from '@lexical/markdown';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ClearEditorPlugin } from '@lexical/react/LexicalClearEditorPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { $createHeadingNode } from '@lexical/rich-text';
import { $patchStyleText } from '@lexical/selection';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_TAB_COMMAND,
} from 'lexical';
import { $getRoot } from 'lexical';
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React, { useEffect, useState } from 'react';

import { CustomHRNode } from './CustomHRNode';
import {
  $createCustomFileNode,
  $createCustomImageNode,
  $createCustomVideoNode,
  $isCustomFileNode,
  $isCustomImageNode,
  $isCustomVideoNode,
  CustomFileNode,
  CustomImageNode,
  CustomVideoNode,
} from './nodes';

import 'bootstrap-icons/font/bootstrap-icons.css';

// 색상 변경 명령어 생성
export const SET_TEXT_COLOR_COMMAND = createCommand('SET_TEXT_COLOR_COMMAND');
export const SET_BG_COLOR_COMMAND = createCommand('SET_BG_COLOR_COMMAND');
export const SET_FONT_FAMILY_COMMAND = createCommand('SET_FONT_FAMILY_COMMAND');
export const SET_IMAGE_ALIGNMENT_COMMAND = createCommand('SET_IMAGE_ALIGNMENT_COMMAND');

// HTML 추출 유틸리티 함수들
export const getEditorHtml = (editor: any) => {
  let htmlString = '';

  editor.update(() => {
    const root = $getRoot();
    htmlString = $generateHtmlFromNodes(editor, null);
  });

  return htmlString;
};

// 에디터 상태를 JSON으로 추출
export const getEditorState = (editor: any) => {
  return editor.getEditorState().toJSON();
};

// HTML을 에디터에 설정
export const setEditorHtml = (editor: any, htmlString: string) => {
  editor.update(() => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(htmlString, 'text/html');
    const nodes = $generateNodesFromDOM(editor, dom);
    const root = $getRoot();
    root.clear();
    root.append(...nodes);
  });
};

// OnChangePlugin에서 HTML 실시간 추출 예제
function HtmlExtractPlugin({ onChange }: { onChange?: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  return (
    <OnChangePlugin
      onChange={(editorState) => {
        if (onChange) {
          editor.update(() => {
            const htmlString = $generateHtmlFromNodes(editor, null);
            onChange(htmlString);
          });
        }
      }}
    />
  );
}

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

function EnterKeyPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // 리스트 아이템에서 엔터키 처리
        let currentNode = anchorNode;
        let listItemNode = null;

        // 부모 노드를 따라 올라가면서 ListItemNode를 찾음
        while (currentNode) {
          if ($isListItemNode(currentNode)) {
            listItemNode = currentNode;
            break;
          }
          const parent = currentNode.getParent();
          if (!parent) break;
          currentNode = parent;
        }

        if (listItemNode) {
          const textContent = listItemNode.getTextContent();

          // 빈 리스트 아이템에서 엔터를 누른 경우
          if (textContent === '') {
            const listNode = listItemNode.getParent();
            if ($isListNode(listNode)) {
              // 1단 리스트인지 확인 (부모가 리스트 아이템이 아닌 경우)
              const listParent = listNode.getParent();
              const isTopLevel = !$isListItemNode(listParent);

              if (isTopLevel) {
                // 1단 리스트에서 빈 아이템의 엔터: 리스트를 빠져나가기
                if (event) event.preventDefault();

                // 새로운 paragraph 생성
                const newParagraph = $createParagraphNode();
                const textNode = $createTextNode('');
                newParagraph.append(textNode);

                // 리스트 뒤에 paragraph 추가
                listNode.insertAfter(newParagraph);

                // 현재 리스트 아이템 제거
                listItemNode.remove();

                // 리스트가 비어있으면 리스트도 제거
                if (listNode.getChildren().length === 0) {
                  listNode.remove();
                }

                // 새로운 paragraph로 포커스 이동
                textNode.select();

                return true;
              }
            }
          }
        }

        // 이미지 노드 앞뒤에서 엔터키 처리
        if (anchorNode.getType() === 'custom-image') {
          // 이미지 노드에서 엔터를 눌렀을 때
          const newParagraph = $createParagraphNode();
          const textNode = $createTextNode('');
          newParagraph.append(textNode);
          anchorNode.insertAfter(newParagraph);
          textNode.select();
          return true;
        }

        // 이미지 노드 바로 앞이나 뒤의 빈 paragraph에서 엔터키 처리
        if ($isParagraphNode(anchorNode)) {
          const textContent = anchorNode.getTextContent();

          // 빈 paragraph에서 엔터를 눌렀을 때
          if (textContent === '') {
            const prevSibling = anchorNode.getPreviousSibling();
            const nextSibling = anchorNode.getNextSibling();

            // 이전 형제가 이미지 노드인 경우
            if (prevSibling && prevSibling.getType() === 'custom-image') {
              const newParagraph = $createParagraphNode();
              const textNode = $createTextNode('');
              newParagraph.append(textNode);
              anchorNode.insertAfter(newParagraph);
              textNode.select();
              return true;
            }

            // 다음 형제가 이미지 노드인 경우
            if (nextSibling && nextSibling.getType() === 'custom-image') {
              const newParagraph = $createParagraphNode();
              const textNode = $createTextNode('');
              newParagraph.append(textNode);
              anchorNode.insertBefore(newParagraph);
              textNode.select();
              return true;
            }
          }

          // paragraph 끝에서 엔터를 눌렀을 때 다음이 이미지 노드인 경우
          if (anchorOffset === textContent.length) {
            const nextSibling = anchorNode.getNextSibling();
            if (nextSibling && nextSibling.getType() === 'custom-image') {
              const newParagraph = $createParagraphNode();
              const textNode = $createTextNode('');
              newParagraph.append(textNode);
              nextSibling.insertBefore(newParagraph);
              textNode.select();
              return true;
            }
          }

          // paragraph 시작에서 엔터를 눌렀을 때 이전이 이미지 노드인 경우
          if (anchorOffset === 0) {
            const prevSibling = anchorNode.getPreviousSibling();
            if (prevSibling && prevSibling.getType() === 'custom-image') {
              const newParagraph = $createParagraphNode();
              const textNode = $createTextNode('');
              newParagraph.append(textNode);
              prevSibling.insertAfter(newParagraph);
              textNode.select();
              return true;
            }
          }
        }

        // 현재 selection의 스타일을 가져옴
        const currentStyle = selection.style || '';

        // 엔터 키 처리 후 새로운 텍스트의 스타일을 유지
        setTimeout(() => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && selection.isCollapsed()) {
              // 새로운 paragraph에 이전 스타일 적용
              selection.style = currentStyle;
            }
          });
        }, 0);

        return false; // 기본 엔터 동작은 유지
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

function HRKeyboardPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      () => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const nodes = selection.getNodes();

          // 선택된 노드 중에 HR이 있는지 확인
          for (const node of nodes) {
            if (node instanceof CustomHRNode) {
              node.remove();
              return true;
            }
          }

          // 빈 paragraph에서 backspace를 누른 경우
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
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

function ListTabIndentationPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();

          // 리스트 아이템 안에 있는지 확인
          let listItemNode = null;
          let currentNode = anchorNode;

          // 부모 노드를 따라 올라가면서 ListItemNode를 찾음
          while (currentNode) {
            if ($isListItemNode(currentNode)) {
              listItemNode = currentNode;
              break;
            }
            const parent = currentNode.getParent();
            if (!parent) break;
            currentNode = parent;
          }

          if (listItemNode) {
            event.preventDefault();

            const listNode = listItemNode.getParent();
            if (!$isListNode(listNode)) return false;

            if (event.shiftKey) {
              // Shift + Tab: 아웃덴트 (들여쓰기 해제)
              const listType = listNode.getListType();
              const currentValue = listItemNode.getValue();

              // 부모 리스트 노드의 부모를 찾음
              const grandParent = listNode.getParent();

              if (grandParent) {
                // 새로운 리스트 아이템 생성
                const newListItem = $createListItemNode();
                newListItem.append(...listItemNode.getChildren());
                newListItem.setValue(currentValue);

                // 현재 아이템을 부모 레벨로 이동
                if ($isListItemNode(grandParent)) {
                  grandParent.insertAfter(newListItem);
                } else {
                  // 최상위 레벨로 이동
                  const newList = $createListNode(listType);
                  newList.append(newListItem);
                  listNode.insertBefore(newList);
                }

                listItemNode.remove();
                newListItem.select();
              }
            } else {
              // Tab: 인덴트 (들여쓰기)
              const prevSibling = listItemNode.getPreviousSibling();

              if ($isListItemNode(prevSibling)) {
                const listType = listNode.getListType();
                const currentValue = listItemNode.getValue();

                // 이전 형제 요소의 자식으로 중첩 리스트 생성
                let nestedList = null;
                const lastChild = prevSibling.getLastChild();

                if ($isListNode(lastChild)) {
                  nestedList = lastChild;
                } else {
                  nestedList = $createListNode(listType);
                  prevSibling.append(nestedList);
                }

                // 새로운 리스트 아이템 생성하여 중첩 리스트에 추가
                const newListItem = $createListItemNode();
                newListItem.append(...listItemNode.getChildren());
                newListItem.setValue(currentValue);

                nestedList.append(newListItem);
                listItemNode.remove();
                newListItem.select();
              }
            }

            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

function CheckboxTogglePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 체크박스 리스트 아이템인지 확인
      const listItem = target.closest('li');
      if (!listItem) return;

      const list = listItem.closest('ul[data-list-type="checkbox"]');
      if (!list) return;

      // 에디터 내의 클릭인지 확인
      if (!editorElement.contains(listItem)) return;

      e.preventDefault();

      // 체크 상태 토글
      const isChecked = listItem.hasAttribute('data-checked');

      if (isChecked) {
        listItem.removeAttribute('data-checked');
      } else {
        listItem.setAttribute('data-checked', 'true');
      }
    };

    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  return null;
}

function ColorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 텍스트 색상 변경 명령어 등록
    editor.registerCommand(
      SET_TEXT_COLOR_COMMAND,
      (color: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          if (selection.isCollapsed()) {
            // 선택 영역이 없을 때 - 현재 selection의 스타일 설정
            selection.style = selection.style ? selection.style + `color: ${color};` : `color: ${color};`;
          } else {
            // 선택 영역이 있을 때 - 선택된 텍스트에만 적용
            $patchStyleText(selection, { color });
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );

    // 배경색 변경 명령어 등록
    editor.registerCommand(
      SET_BG_COLOR_COMMAND,
      (color: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          if (selection.isCollapsed()) {
            // 선택 영역이 없을 때 - 현재 selection의 스타일 설정
            selection.style = selection.style ? selection.style + `background-color: ${color};` : `background-color: ${color};`;
          } else {
            // 선택 영역이 있을 때 - 선택된 텍스트에만 적용
            $patchStyleText(selection, { 'background-color': color });
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

function ImageAlignmentPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      SET_IMAGE_ALIGNMENT_COMMAND,
      (alignment: 'left' | 'center' | 'right') => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          const nodes = selection.getNodes();

          // 선택된 노드 중 이미지 노드 찾기
          for (const node of nodes) {
            if ($isCustomImageNode(node)) {
              node.setAlignment(alignment);
              return true;
            }

            // 부모 노드도 확인
            let currentNode = node.getParent();
            while (currentNode) {
              if ($isCustomImageNode(currentNode)) {
                currentNode.setAlignment(alignment);
                return true;
              }
              currentNode = currentNode.getParent();
            }
          }

          return false;
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

// 이미지 컴포넌트 - 크기 조절 기능 포함 (사용하지 않음)
function ImageComponent({ src, alt, width, height, node }: { src: string; alt: string; width: string; height: string; node: any }) {
  const [editor] = useLexicalComposerContext();
  const [showSizeMenu, setShowSizeMenu] = React.useState(false);
  const [customWidth, setCustomWidth] = React.useState('');
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const sizeOptions = [
    { label: '작게 (25%)', value: '25%' },
    { label: '보통 (50%)', value: '50%' },
    { label: '크게 (75%)', value: '75%' },
    { label: '최대 (100%)', value: '100%' },
    { label: '자동', value: 'auto' },
    { label: '사용자 정의', value: 'custom' },
  ];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSizeMenu(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSizeMenu(!showSizeMenu);
  };

  const handleSizeChange = (newWidth: string) => {
    if (newWidth === 'custom') {
      setShowCustomInput(true);
      return;
    }

    editor.update(() => {
      node.setSize(newWidth);
    });
    setShowSizeMenu(false);
  };

  const handleCustomSizeSubmit = () => {
    if (customWidth) {
      const width = /^\d+$/.test(customWidth) ? `${customWidth}px` : customWidth;

      editor.update(() => {
        node.setSize(width);
      });
      setShowSizeMenu(false);
      setShowCustomInput(false);
      setCustomWidth('');
    }
  };

  return (
    <div className="group relative inline-block" style={{ margin: '10px 0' }}>
      <img
        src={src}
        alt={alt}
        onClick={handleImageClick}
        style={{
          width: width,
          height: height,
          maxWidth: '100%',
          borderRadius: '8px',
          display: 'block',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          border: showSizeMenu ? '3px solid #3B82F6' : '2px solid transparent',
          transition: 'border-color 0.2s ease',
        }}
      />

      {/* 크기 조절 메뉴 */}
      {showSizeMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '0px',
            right: '-220px',
            background: 'white',
            border: '2px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            padding: '12px',
            zIndex: 9999,
            minWidth: '200px',
          }}
        >
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>이미지 크기</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sizeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSizeChange(option.value)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '4px',
                  background: width === option.value ? '#e3f2fd' : 'transparent',
                  color: width === option.value ? '#1976d2' : '#333',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  if (width !== option.value) {
                    (e.target as HTMLElement).style.background = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (width !== option.value) {
                    (e.target as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 사용자 정의 크기 입력 */}
          {showCustomInput && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
              <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>사용자 정의 크기 (예: 300px, 50%, 20rem)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  placeholder="300px"
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: '12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomSizeSubmit()}
                />
                <button
                  onClick={handleCustomSizeSubmit}
                  style={{
                    padding: '4px 8px',
                    background: '#2196f3',
                    color: 'white',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  적용
                </button>
              </div>
            </div>
          )}

          {/* 현재 크기 표시 */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee', fontSize: '11px', color: '#666' }}>
            현재 크기: {width} × {height}
          </div>
        </div>
      )}
    </div>
  );
}

// LinkClickPlugin 추가
function LinkClickPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 에디터 DOM 요소에 클릭 이벤트 리스너 추가
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestLink = target.closest('a');

      if (closestLink) {
        e.preventDefault();
        window.open(closestLink.href, '_blank');
      }
    };

    editorElement.addEventListener('click', handleClick);

    return () => {
      editorElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  return null;
}

function MediaDeletionPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();

          // 미디어 노드들을 체크
          let mediaNode = null;

          if ($isCustomImageNode(anchorNode)) {
            mediaNode = anchorNode;
          } else if ($isCustomVideoNode(anchorNode)) {
            mediaNode = anchorNode;
          } else if ($isCustomFileNode(anchorNode)) {
            mediaNode = anchorNode;
          } else {
            // 부모 노드들도 체크
            let currentNode = anchorNode.getParent();
            while (currentNode) {
              if ($isCustomImageNode(currentNode) || $isCustomVideoNode(currentNode) || $isCustomFileNode(currentNode)) {
                mediaNode = currentNode;
                break;
              }
              currentNode = currentNode.getParent();
            }
          }

          // 미디어 노드가 선택되었을 때 삭제
          if (mediaNode) {
            event.preventDefault();

            // 에디터에서만 노드 삭제 (서버에서는 삭제하지 않음)
            // 실제 미디어 파일 삭제는 usermanage의 media 관리 창에서만 가능
            mediaNode.remove();

            return true;
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}

export default function Editor() {
  const [defaultFontFamily, setDefaultFontFamily] = useState('inherit');
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // 전역에서 에디터에 접근할 수 있도록 설정
    (window as any).__lexicalEditor = editor;

    // DOM 요소에도 에디터 참조 저장
    const editorElement = editor.getRootElement();
    if (editorElement) {
      (editorElement as any)._lexicalEditor = editor;
    }

    return () => {
      delete (window as any).__lexicalEditor;
    };
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SET_FONT_FAMILY_COMMAND,
      (fontFamily: string) => {
        setDefaultFontFamily(fontFamily || 'inherit');
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return (
    <div className="rounded border border-gray-300 bg-white">
      <style jsx global>{`
        /* 에디터 전용 동적 글꼴 스타일 */
        .editor-content {
          font-family: ${defaultFontFamily};
        }
      `}</style>
      <div className="p-4">
        <RichTextPlugin
          contentEditable={<ContentEditable className="prose editor-content min-h-[400px] max-w-none text-black outline-none" />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <LinkClickPlugin />
        <CheckboxTogglePlugin />
        <MediaDeletionPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <AutoFocusPlugin />
        <ClearEditorPlugin />
        <OnChange />
        <EnterKeyPlugin />
        <HRKeyboardPlugin />
        <ListTabIndentationPlugin />
        <ColorPlugin />
        <ImageAlignmentPlugin />
        <HtmlExtractPlugin />
      </div>
    </div>
  );
}
