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

// 이미지 노드 관련 타입
type SerializedImageNode = Spread<
  {
    src: string;
    alt: string;
    width: string;
    height: string;
    mediaId?: number;
    alignment: 'left' | 'center' | 'right';
  },
  SerializedLexicalNode
>;

// 커스텀 이미지 노드 생성
export class CustomImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __alt: string;
  __width: string;
  __height: string;
  __mediaId?: number;
  __alignment: 'left' | 'center' | 'right';

  static getType(): string {
    return 'custom-image';
  }

  static clone(node: CustomImageNode): CustomImageNode {
    return new CustomImageNode(node.__src, node.__alt, node.__width, node.__height, node.__mediaId, node.__alignment, node.__key);
  }

  constructor(src: string, alt: string, width: string = 'auto', height: string = 'auto', mediaId?: number, alignment: 'left' | 'center' | 'right' = 'center', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__height = height;
    this.__mediaId = mediaId;
    this.__alignment = alignment;
  }

  createDOM(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.margin = '20px 0';
    container.setAttribute('data-custom-image', 'true');
    
    // 정렬에 따른 스타일 적용
    switch (this.__alignment) {
      case 'left':
        container.style.textAlign = 'left';
        break;
      case 'right':
        container.style.textAlign = 'right';
        break;
      case 'center':
      default:
    container.style.textAlign = 'center';
        break;
    }

    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    img.style.width = this.__width;
    img.style.height = this.__height;
    img.style.borderRadius = '8px';
    img.style.display = 'block';
    img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    img.style.transition = 'border-color 0.2s ease';
    img.style.border = '2px solid transparent';
    img.style.userSelect = 'none';
    img.draggable = true;

    // 리사이즈 컨테이너
    const resizeContainer = document.createElement('div');
    resizeContainer.style.position = 'relative';
    resizeContainer.style.display = 'inline-block';
    resizeContainer.style.border = '2px solid transparent';
    resizeContainer.style.borderRadius = '8px';

    // 리사이즈 핸들들 생성
    const handles = [
      { position: 'nw', cursor: 'nw-resize', top: '-5px', left: '-5px' },
      { position: 'ne', cursor: 'ne-resize', top: '-5px', right: '-5px' },
      { position: 'sw', cursor: 'sw-resize', bottom: '-5px', left: '-5px' },
      { position: 'se', cursor: 'se-resize', bottom: '-5px', right: '-5px' },
      { position: 'n', cursor: 'n-resize', top: '-5px', left: '50%', transform: 'translateX(-50%)' },
      { position: 's', cursor: 's-resize', bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
      { position: 'w', cursor: 'w-resize', top: '50%', left: '-5px', transform: 'translateY(-50%)' },
      { position: 'e', cursor: 'e-resize', top: '50%', right: '-5px', transform: 'translateY(-50%)' },
    ];

    let isSelected = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let aspectRatio = 1;

    // 이미지 선택 상태 토글
    const toggleSelection = (selected: boolean) => {
      isSelected = selected;
      if (selected) {
        resizeContainer.style.border = '2px solid #3B82F6';
        handles.forEach(handleInfo => {
          const handle = resizeContainer.querySelector(`[data-handle="${handleInfo.position}"]`) as HTMLElement;
          if (handle) {
            handle.style.display = 'block';
          }
        });
      } else {
        resizeContainer.style.border = '2px solid transparent';
        handles.forEach(handleInfo => {
          const handle = resizeContainer.querySelector(`[data-handle="${handleInfo.position}"]`) as HTMLElement;
          if (handle) {
            handle.style.display = 'none';
          }
        });
      }
    };

    // 이미지 클릭 이벤트
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSelection(!isSelected);
      
      // 이미지 선택 시 에디터에 포커스 설정하고 노드 선택
      if (!isSelected) {
        // 에디터를 통해 이미지 노드 선택
        setTimeout(() => {
          const editorElement = container.closest('[contenteditable="true"]');
          if (editorElement) {
            (editorElement as HTMLElement).focus();
            
            // 이미지 노드를 선택 상태로 만들기
            const selection = window.getSelection();
            if (selection) {
              selection.removeAllRanges();
              const range = document.createRange();
              range.selectNode(container);
              selection.addRange(range);
            }
          }
        }, 0);
      }
    });

        // 드래그 앤 드롭 이벤트 처리
    let dragStartY = 0;
    let dropIndicator: HTMLElement | null = null;
    let isDragImage = false;
    let currentDropTarget: HTMLElement | null = null;

    // 드롭 인디케이터 생성
    const createDropIndicator = () => {
      const indicator = document.createElement('div');
      indicator.style.height = '3px';
      indicator.style.backgroundColor = '#3B82F6';
      indicator.style.borderRadius = '2px';
      indicator.style.margin = '2px 0';
      indicator.style.opacity = '0.8';
      indicator.style.boxShadow = '0 0 4px rgba(59, 130, 246, 0.5)';
      indicator.classList.add('drop-indicator');
      return indicator;
    };

    // 드래그 시작 (실제로는 mousedown에서 처리)
    img.addEventListener('mousedown', (e) => {
      // 리사이즈 중이면 드래그 방지
      if (isDragging) {
        return;
      }
      
      // 오른쪽 클릭은 무시
      if (e.button !== 0) {
        return;
      }
      
             e.preventDefault();
        e.stopPropagation();

      isDragImage = true;
      currentDropTarget = null;
      dragStartY = e.clientY;
      
      // 드래그 중 스타일
      container.style.opacity = '0.5';
      toggleSelection(false);
      
      // 마우스 이동 이벤트 등록
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragImage) return;
        
        // 현재 마우스 위치의 요소 찾기
        const elementBelow = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
        if (!elementBelow) return;
        
        const paragraph = elementBelow.closest('p, div, h1, h2, h3, h4, h5, h6, li, [data-lexical-editor]');
        
        if (paragraph && paragraph !== container && !paragraph.closest('[data-custom-image]')) {
          // 이전 인디케이터 제거
          document.querySelectorAll('.drop-indicator').forEach(indicator => {
            if (indicator.parentNode) {
              indicator.parentNode.removeChild(indicator);
            }
          });
          
          // 새 드롭 타겟 설정
          currentDropTarget = paragraph as HTMLElement;
          
          // 새 인디케이터 생성
          dropIndicator = createDropIndicator();
          
          // 마우스 위치에 따라 위 또는 아래에 인디케이터 표시
          const rect = paragraph.getBoundingClientRect();
          const isUpperHalf = moveEvent.clientY < rect.top + rect.height / 2;
          
          if (isUpperHalf) {
            paragraph.parentNode?.insertBefore(dropIndicator, paragraph);
      } else {
            paragraph.parentNode?.insertBefore(dropIndicator, paragraph.nextSibling);
          }
          
          
        }
      };
      
             // 마우스 업 이벤트에서 실제 드롭 처리
       const handleMouseUp = (upEvent: MouseEvent) => {
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
         
         isDragImage = false;
         container.style.opacity = '1';
         
         // 유효한 드롭 타겟이 있으면 이동 처리
         if (currentDropTarget) {
          
          // 에디터 인스턴스 찾기
          let editorInstance = (window as any).__lexicalEditor;
          
          if (!editorInstance) {
            const editors = document.querySelectorAll('[contenteditable="true"]');
            for (const ed of editors) {
              if ((ed as any)._lexicalEditor) {
                editorInstance = (ed as any)._lexicalEditor;
                break;
              }
            }
          }
          
                     if (editorInstance) {
             editorInstance.update(() => {
              try {
                // 현재 이미지 노드 찾기
                const root = $getRoot();
                let imageNode: CustomImageNode | null = null;
                
                for (const child of root.getChildren()) {
                  if ($isCustomImageNode(child) && child.__src === this.__src) {
                    imageNode = child;
                    break;
                  }
                }

                                 if (imageNode && currentDropTarget) {
                   // 드롭 위치 결정
                   const rect = currentDropTarget.getBoundingClientRect();
                   const isUpperHalf = upEvent.clientY < rect.top + rect.height / 2;
                  
                  // 새 이미지 노드 생성
                  const newImageNode = $createCustomImageNode(
                    imageNode.__src, 
                    imageNode.__alt, 
                    imageNode.__width, 
                    imageNode.__height, 
                    imageNode.__mediaId, 
                    imageNode.__alignment
                  );
                  
                  // 빈 paragraph 생성
                  const beforeParagraph = $createParagraphNode();
                  beforeParagraph.append($createTextNode(''));
                  
                  const afterParagraph = $createParagraphNode();
                  afterParagraph.append($createTextNode(''));
                  
                  // 타겟 노드 찾기
                  let targetNode = null;
                  for (const node of root.getChildren()) {
                    const domNode = editorInstance.getElementByKey(node.getKey());
                    if (domNode && (domNode === currentDropTarget || domNode.contains(currentDropTarget))) {
                      targetNode = node;
                      break;
                    }
                  }
                  
                                     if (targetNode) {
                     // 새 위치에 삽입
                    if (isUpperHalf) {
                      targetNode.insertBefore(beforeParagraph);
                      beforeParagraph.insertAfter(newImageNode);
                      newImageNode.insertAfter(afterParagraph);
                    } else {
                      targetNode.insertAfter(afterParagraph);
                      afterParagraph.insertBefore(newImageNode);
                      newImageNode.insertBefore(beforeParagraph);
                    }
                    
                                         // 기존 노드 제거
                     imageNode.remove();
                   } else {
                     // 타겟을 못 찾으면 루트 끝에 추가
                     root.append(beforeParagraph);
                     root.append(newImageNode);
                     root.append(afterParagraph);
                     imageNode.remove();
                   }
                }
                               } catch (error) {
                   // 에러 발생 시 조용히 처리
                 }
            });
                     }
         }
        
        // 인디케이터 제거
        document.querySelectorAll('.drop-indicator').forEach(indicator => {
          if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
          }
        });
        
        // 변수 초기화
        currentDropTarget = null;
        dropIndicator = null;
      };
      
      // 이벤트 리스너 등록
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    // 기본 dragstart 이벤트는 방지
    img.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });

    

    // 외부 클릭시 선택 해제
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        toggleSelection(false);
      }
    });

    // 리사이즈 핸들 생성 및 이벤트 처리
    handles.forEach(handleInfo => {
      const handle = document.createElement('div');
      handle.setAttribute('data-handle', handleInfo.position);
      handle.style.position = 'absolute';
      handle.style.width = '10px';
      handle.style.height = '10px';
      handle.style.backgroundColor = '#3B82F6';
      handle.style.border = '1px solid #ffffff';
      handle.style.borderRadius = '2px';
      handle.style.cursor = handleInfo.cursor;
      handle.style.display = 'none';
      handle.style.zIndex = '1000';
      
      // 위치 설정
      if (handleInfo.top) handle.style.top = handleInfo.top;
      if (handleInfo.bottom) handle.style.bottom = handleInfo.bottom;
      if (handleInfo.left) handle.style.left = handleInfo.left;
      if (handleInfo.right) handle.style.right = handleInfo.right;
      if (handleInfo.transform) handle.style.transform = handleInfo.transform;

      // 드래그 시작
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
        aspectRatio = startWidth / startHeight;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        // 핸들 위치에 따른 크기 계산
        switch (handleInfo.position) {
          case 'se': // 오른쪽 아래
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'sw': // 왼쪽 아래
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'ne': // 오른쪽 위
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            break;
          case 'nw': // 왼쪽 위
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
            break;
          case 'e': // 오른쪽
            newWidth = startWidth + deltaX;
            newHeight = newWidth / aspectRatio;
            break;
          case 'w': // 왼쪽
            newWidth = startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
            break;
          case 's': // 아래
            newHeight = startHeight + deltaY;
            newWidth = newHeight * aspectRatio;
            break;
          case 'n': // 위
            newHeight = startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
            break;
        }

        // Shift 키로 비율 유지
        if (e.shiftKey) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        // 최소 크기 제한
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        // 최대 크기 제한 (부모 컨테이너 기준)
        const maxWidth = container.parentElement?.offsetWidth || 800;
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, (maxWidth / aspectRatio));

        img.style.width = `${newWidth}px`;
        img.style.height = `${newHeight}px`;
      };

             const handleMouseUp = () => {
         isDragging = false;
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
         
         // 에디터를 통해 노드의 크기 정보 업데이트
         const editorInstance = (container.closest('[contenteditable="true"]') as any)?._lexicalEditor;
         if (editorInstance) {
           editorInstance.update(() => {
             // 현재 이미지 노드 찾기
             const root = $getRoot();
             const imageNodes = root.getChildren().filter($isCustomImageNode);
             const currentNode = imageNodes.find(node => node.__src === this.__src);
             
             if (currentNode) {
               const writable = currentNode.getWritable();
               writable.__width = img.style.width;
               writable.__height = img.style.height;
             }
           });
         }
       };

      resizeContainer.appendChild(handle);
    });

    // 이미지가 로드되면 aspect ratio 계산
    img.addEventListener('load', () => {
      aspectRatio = img.naturalWidth / img.naturalHeight;
    });

    resizeContainer.appendChild(img);
    container.appendChild(resizeContainer);

    return container;
  }

  updateDOM(prevNode: CustomImageNode): boolean {
    // 정렬이 변경되었으면 DOM을 다시 생성
    return this.__alignment !== prevNode.__alignment || 
           this.__width !== prevNode.__width || 
           this.__height !== prevNode.__height;
  }

  setSize(width: string, height: string = 'auto'): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setAlignment(alignment: 'left' | 'center' | 'right'): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  static importJSON(serializedNode: SerializedImageNode): CustomImageNode {
    const { src, alt, width, height, mediaId, alignment } = serializedNode;
    return new CustomImageNode(src, alt, width, height, mediaId, alignment);
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
      height: this.__height,
      mediaId: this.__mediaId,
      alignment: this.__alignment,
      type: 'custom-image',
      version: 1,
    };
  }

  decorate(): React.ReactElement {
    return <div style={{ display: 'none' }} />;
  }

  isInline(): false {
    return false;
  }
}

export function $createCustomImageNode(src: string, alt: string, width: string = 'auto', height: string = 'auto', mediaId?: number, alignment: 'left' | 'center' | 'right' = 'center'): CustomImageNode {
  return new CustomImageNode(src, alt, width, height, mediaId, alignment);
}

export function $isCustomImageNode(node: LexicalNode | null | undefined): node is CustomImageNode {
  return node instanceof CustomImageNode;
}

// 파일 노드 관련 타입
type SerializedFileNode = Spread<
  {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileData: string; // Base64 데이터 또는 Object URL
  },
  SerializedLexicalNode
>;

// 커스텀 파일 노드 클래스
export class CustomFileNode extends DecoratorNode<React.ReactElement> {
  __fileName: string;
  __fileSize: number;
  __fileType: string;
  __fileData: string;

  static getType(): string {
    return 'custom-file';
  }

  static clone(node: CustomFileNode): CustomFileNode {
    return new CustomFileNode(node.__fileName, node.__fileSize, node.__fileType, node.__fileData, node.__key);
  }

  constructor(fileName: string, fileSize: number, fileType: string, fileData: string, key?: NodeKey) {
    super(key);
    this.__fileName = fileName;
    this.__fileSize = fileSize;
    this.__fileType = fileType;
    this.__fileData = fileData;
  }

  createDOM(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.margin = '20px 0';
    container.style.textAlign = 'center';

    const fileCard = document.createElement('div');
    fileCard.style.display = 'inline-block';
    fileCard.style.padding = '16px 20px';
    fileCard.style.border = '2px solid #e5e5e5';
    fileCard.style.borderRadius = '8px';
    fileCard.style.backgroundColor = '#f9f9f9';
    fileCard.style.cursor = 'pointer';
    fileCard.style.transition = 'all 0.2s ease';
    fileCard.style.maxWidth = '300px';
    fileCard.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';

    // 파일 아이콘
    const icon = document.createElement('div');
    icon.style.fontSize = '32px';
    icon.style.marginBottom = '8px';
    icon.innerHTML = this.getFileIcon();

    // 파일 이름
    const fileName = document.createElement('div');
    fileName.style.fontWeight = 'bold';
    fileName.style.marginBottom = '4px';
    fileName.style.color = '#333';
    fileName.textContent = this.__fileName;

    // 파일 정보
    const fileInfo = document.createElement('div');
    fileInfo.style.fontSize = '12px';
    fileInfo.style.color = '#666';
    fileInfo.textContent = `${this.__fileType.toUpperCase()} • ${this.formatFileSize(this.__fileSize)}`;

    // 다운로드 버튼
    const downloadBtn = document.createElement('button');
    downloadBtn.style.marginTop = '8px';
    downloadBtn.style.padding = '6px 12px';
    downloadBtn.style.backgroundColor = '#3b82f6';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '4px';
    downloadBtn.style.fontSize = '12px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.textContent = '다운로드';

    // 호버 효과
    fileCard.addEventListener('mouseenter', () => {
      fileCard.style.borderColor = '#3b82f6';
      fileCard.style.backgroundColor = '#f0f9ff';
    });

    fileCard.addEventListener('mouseleave', () => {
      fileCard.style.borderColor = '#e5e5e5';
      fileCard.style.backgroundColor = '#f9f9f9';
    });

    // 다운로드 기능
    downloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.downloadFile();
    });

    fileCard.appendChild(icon);
    fileCard.appendChild(fileName);
    fileCard.appendChild(fileInfo);
    fileCard.appendChild(downloadBtn);
    container.appendChild(fileCard);

    return container;
  }

  private getFileIcon(): string {
    const extension = this.__fileName.split('.').pop()?.toLowerCase() || '';

    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📋';
      case 'zip':
      case 'rar':
      case '7z':
        return '🗜️';
      case 'txt':
        return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
        return '🎥';
      case 'mp3':
      case 'wav':
        return '🎵';
      default:
        return '📁';
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private downloadFile(): void {
    try {
      // Base64 데이터인 경우
      if (this.__fileData.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = this.__fileData;
        link.download = this.__fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Object URL인 경우
        const link = document.createElement('a');
        link.href = this.__fileData;
        link.download = this.__fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedFileNode): CustomFileNode {
    const { fileName, fileSize, fileType, fileData } = serializedNode;
    const node = new CustomFileNode(fileName, fileSize, fileType, fileData);
    return node;
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      fileName: this.__fileName,
      fileSize: this.__fileSize,
      fileType: this.__fileType,
      fileData: this.__fileData,
      type: 'custom-file',
      version: 1,
    };
  }

  decorate(): React.ReactElement {
    return <div style={{ display: 'none' }} />;
  }
}

export function $createCustomFileNode(fileName: string, fileSize: number, fileType: string, fileData: string): CustomFileNode {
  return new CustomFileNode(fileName, fileSize, fileType, fileData);
}

export function $isCustomFileNode(node: LexicalNode | null | undefined): node is CustomFileNode {
  return node instanceof CustomFileNode;
}

// 비디오 노드 관련 타입
type SerializedVideoNode = Spread<
  {
    src: string;
    alt: string;
    width: string;
    height: string;
  },
  SerializedLexicalNode
>;

// 커스텀 비디오 노드 클래스
export class CustomVideoNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __alt: string;
  __width: string;
  __height: string;

  static getType(): string {
    return 'custom-video';
  }

  static clone(node: CustomVideoNode): CustomVideoNode {
    return new CustomVideoNode(node.__src, node.__alt, node.__width, node.__height, node.__key);
  }

  constructor(src: string, alt: string, width: string = '100%', height: string = 'auto', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__height = height;
  }

  createDOM(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'inline-block';
    container.style.margin = '20px auto';
    container.style.textAlign = 'center';

    // 리사이즈 컨테이너
    const resizeContainer = document.createElement('div');
    resizeContainer.style.position = 'relative';
    resizeContainer.style.display = 'inline-block';
    resizeContainer.style.border = '2px solid transparent';
    resizeContainer.style.borderRadius = '8px';

    const videoCard = document.createElement('div');
    videoCard.style.display = 'block';
    videoCard.style.border = '2px solid #e5e5e5';
    videoCard.style.borderRadius = '8px';
    videoCard.style.overflow = 'hidden';
    videoCard.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    videoCard.style.backgroundColor = '#000';

    const video = document.createElement('video');
    video.src = this.__src;
    video.style.width = this.__width;
    video.style.height = this.__height;
    video.style.display = 'block';
    video.controls = true;
    video.preload = 'metadata';
    video.style.userSelect = 'none';

    // 비디오 제목/설명
    if (this.__alt && this.__alt !== '비디오') {
      const title = document.createElement('div');
      title.textContent = this.__alt;
      title.style.padding = '12px 16px';
      title.style.backgroundColor = '#f9f9f9';
      title.style.borderTop = '1px solid #e5e5e5';
      title.style.fontSize = '14px';
      title.style.fontWeight = 'bold';
      title.style.color = '#333';
      title.style.textAlign = 'left';

      videoCard.appendChild(video);
      videoCard.appendChild(title);
    } else {
      videoCard.appendChild(video);
    }

    // 리사이즈 핸들들 생성
    const handles = [
      { position: 'nw', cursor: 'nw-resize', top: '-5px', left: '-5px' },
      { position: 'ne', cursor: 'ne-resize', top: '-5px', right: '-5px' },
      { position: 'sw', cursor: 'sw-resize', bottom: '-5px', left: '-5px' },
      { position: 'se', cursor: 'se-resize', bottom: '-5px', right: '-5px' },
      { position: 'n', cursor: 'n-resize', top: '-5px', left: '50%', transform: 'translateX(-50%)' },
      { position: 's', cursor: 's-resize', bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
      { position: 'w', cursor: 'w-resize', top: '50%', left: '-5px', transform: 'translateY(-50%)' },
      { position: 'e', cursor: 'e-resize', top: '50%', right: '-5px', transform: 'translateY(-50%)' },
    ];

    let isSelected = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let aspectRatio = 16/9; // 기본 비율

    // 비디오 선택 상태 토글
    const toggleSelection = (selected: boolean) => {
      isSelected = selected;
      if (selected) {
        resizeContainer.style.border = '2px solid #3B82F6';
        handles.forEach(handleInfo => {
          const handle = resizeContainer.querySelector(`[data-handle="${handleInfo.position}"]`) as HTMLElement;
          if (handle) {
            handle.style.display = 'block';
          }
        });
      } else {
        resizeContainer.style.border = '2px solid transparent';
        handles.forEach(handleInfo => {
          const handle = resizeContainer.querySelector(`[data-handle="${handleInfo.position}"]`) as HTMLElement;
          if (handle) {
            handle.style.display = 'none';
          }
        });
      }
    };

    // 비디오 클릭 이벤트 (비디오 컨트롤과 겹치지 않도록 조정)
    videoCard.addEventListener('click', (e) => {
      // 비디오 컨트롤 영역 클릭은 무시
      if ((e.target as HTMLElement).tagName === 'VIDEO') {
        const rect = video.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const videoHeight = rect.height;
        
        // 하단 컨트롤 영역(전체 높이의 10%) 클릭은 무시
        if (y > videoHeight * 0.9) {
          return;
        }
      }
      
      e.stopPropagation();
      toggleSelection(!isSelected);
    });

    // 외부 클릭시 선택 해제
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        toggleSelection(false);
      }
    });

    // 리사이즈 핸들 생성 및 이벤트 처리
    handles.forEach(handleInfo => {
      const handle = document.createElement('div');
      handle.setAttribute('data-handle', handleInfo.position);
      handle.style.position = 'absolute';
      handle.style.width = '10px';
      handle.style.height = '10px';
      handle.style.backgroundColor = '#3B82F6';
      handle.style.border = '1px solid #ffffff';
      handle.style.borderRadius = '2px';
      handle.style.cursor = handleInfo.cursor;
      handle.style.display = 'none';
      handle.style.zIndex = '1000';
      
      // 위치 설정
      if (handleInfo.top) handle.style.top = handleInfo.top;
      if (handleInfo.bottom) handle.style.bottom = handleInfo.bottom;
      if (handleInfo.left) handle.style.left = handleInfo.left;
      if (handleInfo.right) handle.style.right = handleInfo.right;
      if (handleInfo.transform) handle.style.transform = handleInfo.transform;

      // 드래그 시작
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = video.offsetWidth;
        startHeight = video.offsetHeight;
        aspectRatio = startWidth / startHeight;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      });

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        // 핸들 위치에 따른 크기 계산
        switch (handleInfo.position) {
          case 'se': // 오른쪽 아래
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'sw': // 왼쪽 아래
            newWidth = startWidth - deltaX;
            newHeight = startHeight + deltaY;
            break;
          case 'ne': // 오른쪽 위
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            break;
          case 'nw': // 왼쪽 위
            newWidth = startWidth - deltaX;
            newHeight = startHeight - deltaY;
            break;
          case 'e': // 오른쪽
            newWidth = startWidth + deltaX;
            newHeight = newWidth / aspectRatio;
            break;
          case 'w': // 왼쪽
            newWidth = startWidth - deltaX;
            newHeight = newWidth / aspectRatio;
            break;
          case 's': // 아래
            newHeight = startHeight + deltaY;
            newWidth = newHeight * aspectRatio;
            break;
          case 'n': // 위
            newHeight = startHeight - deltaY;
            newWidth = newHeight * aspectRatio;
            break;
        }

        // Shift 키로 비율 유지
        if (e.shiftKey) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            newHeight = newWidth / aspectRatio;
      } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        // 최소 크기 제한
        newWidth = Math.max(200, newWidth);
        newHeight = Math.max(112, newHeight); // 16:9 비율 기준

        // 최대 크기 제한 (부모 컨테이너 기준)
        const maxWidth = container.parentElement?.offsetWidth || 800;
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, (maxWidth / aspectRatio));

        video.style.width = `${newWidth}px`;
        video.style.height = `${newHeight}px`;
      };

             const handleMouseUp = () => {
         isDragging = false;
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
         
         // 에디터를 통해 노드의 크기 정보 업데이트
         const editorInstance = (container.closest('[contenteditable="true"]') as any)?._lexicalEditor;
         if (editorInstance) {
           editorInstance.update(() => {
             // 현재 비디오 노드 찾기
             const root = $getRoot();
             const videoNodes = root.getChildren().filter($isCustomVideoNode);
             const currentNode = videoNodes.find(node => node.__src === this.__src);
             
             if (currentNode) {
               const writable = currentNode.getWritable();
               writable.__width = video.style.width;
               writable.__height = video.style.height;
             }
           });
         }
       };

      resizeContainer.appendChild(handle);
    });

    // 비디오가 로드되면 aspect ratio 계산
    video.addEventListener('loadedmetadata', () => {
      aspectRatio = video.videoWidth / video.videoHeight;
    });

    resizeContainer.appendChild(videoCard);
    container.appendChild(resizeContainer);

    return container;
  }

  updateDOM(): false {
    return false;
  }

  setSize(width: string, height: string = 'auto'): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  static importJSON(serializedNode: SerializedVideoNode): CustomVideoNode {
    const { src, alt, width, height } = serializedNode;
    const node = new CustomVideoNode(src, alt, width, height);
    return node;
  }

  exportJSON(): SerializedVideoNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      alt: this.__alt,
      width: this.__width,
      height: this.__height,
      type: 'custom-video',
      version: 1,
    };
  }

  decorate(): React.ReactElement {
    return <div style={{ display: 'none' }} />;
  }

  isInline(): false {
    return false;
  }
}

export function $createCustomVideoNode(src: string, alt: string, width: string = '100%', height: string = 'auto'): CustomVideoNode {
  return new CustomVideoNode(src, alt, width, height);
}

export function $isCustomVideoNode(node: LexicalNode | null | undefined): node is CustomVideoNode {
  return node instanceof CustomVideoNode;
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
