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
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { $createParagraphNode, $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, COMMAND_PRIORITY_LOW, createCommand, KEY_BACKSPACE_COMMAND, KEY_ENTER_COMMAND } from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot } from 'lexical';
import React from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey } from 'lexical';
import { CustomHRNode } from "./CustomHRNode";

// 색상 변경 명령어 생성
export const SET_TEXT_COLOR_COMMAND = createCommand('SET_TEXT_COLOR_COMMAND');
export const SET_BG_COLOR_COMMAND = createCommand('SET_BG_COLOR_COMMAND');
export const SET_FONT_FAMILY_COMMAND = createCommand('SET_FONT_FAMILY_COMMAND');

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

  React.useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

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

        // 엔터 키 처리 후 새로운 텍스트의 스타일을 초기화
        setTimeout(() => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection) && selection.isCollapsed()) {
              // 새로운 paragraph에서 모든 스타일 초기화
              const anchorNode = selection.anchor.getNode();
              
              // 현재 노드가 paragraph이고 텍스트가 없는 경우 (새로운 라인)
              if ($isParagraphNode(anchorNode) && anchorNode.getTextContent() === '') {
                // 새로운 텍스트 노드를 생성하여 기본 스타일로 설정
                const newTextNode = $createTextNode('');
                newTextNode.setStyle(''); // 모든 스타일 제거
                anchorNode.append(newTextNode);
                newTextNode.select();
              }
              
              // selection의 스타일도 초기화
              selection.style = '';
            }
          });
        }, 10); // 약간의 지연을 주어 DOM 업데이트 후 실행
        
        return false; // 기본 엔터 동작은 유지
      },
      COMMAND_PRIORITY_LOW
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
            $patchStyleText(selection, { 'color': color });
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
            $patchStyleText(selection, { 'background-color': color });
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    // 글씨체 변경 명령어 등록
    editor.registerCommand(
      SET_FONT_FAMILY_COMMAND,
      (fontFamily: string) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          // 선택된 텍스트가 있는 경우
          if (!selection.isCollapsed()) {
            if (fontFamily === '') {
              $patchStyleText(selection, { 'font-family': null });
            } else {
              $patchStyleText(selection, { 'font-family': fontFamily });
            }
          } else {
            // 텍스트가 선택되지 않은 경우 - 현재 커서 위치에서 입력될 텍스트에 스타일 적용
            if (fontFamily === '') {
              // 기본 글씨체로 설정
              selection.style = selection.style ? selection.style.replace(/font-family:[^;]*;?/g, '') : '';
            } else {
              // 현재 selection의 스타일에 글씨체 추가/수정
              const currentStyle = selection.style || '';
              const newStyle = currentStyle.replace(/font-family:[^;]*;?/g, '') + `font-family: ${fontFamily};`;
              selection.style = newStyle;
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return null;
}

// 이미지 컴포넌트 - 크기 조절 기능 포함 (사용하지 않음)
function ImageComponent({ src, alt, width, height, node }: { 
  src: string; 
  alt: string; 
  width: string; 
  height: string; 
  node: any;
}) {
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
    { label: '사용자 정의', value: 'custom' }
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
    <div className="relative inline-block group" style={{ margin: '10px 0' }}>
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
          transition: 'border-color 0.2s ease'
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
            minWidth: '200px'
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
                  cursor: 'pointer'
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
              <label style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                사용자 정의 크기 (예: 300px, 50%, 20rem)
              </label>
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
                    borderRadius: '4px'
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
                    cursor: 'pointer'
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

// 커스텀 이미지 노드 생성
export class CustomImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __alt: string;
  __width: string;
  __height: string;

  static getType(): string {
    return 'custom-image';
  }

  static clone(node: CustomImageNode): CustomImageNode {
    return new CustomImageNode(node.__src, node.__alt, node.__width, node.__height, node.__key);
  }

  constructor(src: string, alt: string, width: string = 'auto', height: string = 'auto', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
    this.__height = height;
  }

  createDOM(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.margin = '20px 0';
    container.style.textAlign = 'center';
    
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    img.style.maxWidth = '100%';
    img.style.width = this.__width;
    img.style.height = this.__height;
    img.style.borderRadius = '8px';
    img.style.display = 'inline-block';
    img.style.cursor = 'pointer';
    img.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    img.style.transition = 'border-color 0.2s ease';
    img.style.border = '2px solid transparent';
    
    // 크기 조절 메뉴 생성
    const sizeMenu = document.createElement('div');
    sizeMenu.style.position = 'absolute';
    sizeMenu.style.top = '0px';
    sizeMenu.style.right = '-220px';
    sizeMenu.style.background = 'white';
    sizeMenu.style.border = '2px solid #ccc';
    sizeMenu.style.borderRadius = '8px';
    sizeMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    sizeMenu.style.padding = '12px';
    sizeMenu.style.zIndex = '9999';
    sizeMenu.style.minWidth = '200px';
    sizeMenu.style.display = 'none';
    
    // 메뉴 제목
    const title = document.createElement('h4');
    title.textContent = '이미지 크기';
    title.style.margin = '0 0 8px 0';
    title.style.fontSize = '14px';
    title.style.fontWeight = 'bold';
    sizeMenu.appendChild(title);
    
    // 크기 옵션들
    const sizeOptions = [
      { label: '작게 (25%)', value: '25%' },
      { label: '보통 (50%)', value: '50%' },
      { label: '크게 (75%)', value: '75%' },
      { label: '최대 (100%)', value: '100%' },
      { label: '자동', value: 'auto' }
    ];
    
    // 현재 크기 표시
    const currentSize = document.createElement('div');
    currentSize.textContent = `현재 크기: ${this.__width} × ${this.__height}`;
    currentSize.style.marginTop = '12px';
    currentSize.style.paddingTop = '12px';
    currentSize.style.borderTop = '1px solid #eee';
    currentSize.style.fontSize = '11px';
    currentSize.style.color = '#666';
    
    sizeOptions.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.label;
      button.style.width = '100%';
      button.style.textAlign = 'left';
      button.style.padding = '8px';
      button.style.fontSize = '13px';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.background = 'transparent';
      button.style.cursor = 'pointer';
      button.style.marginBottom = '4px';
      
      button.addEventListener('mouseenter', () => {
        button.style.background = '#f5f5f5';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.background = 'transparent';
      });
      
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // 이미지 크기 업데이트
        img.style.width = option.value;
        
        // 현재 크기 표시 업데이트
        currentSize.textContent = `현재 크기: ${option.value} × auto`;
        
        // 메뉴 닫기
        sizeMenu.style.display = 'none';
        img.style.border = '2px solid transparent';
      });
      
      sizeMenu.appendChild(button);
    });
    
    sizeMenu.appendChild(currentSize);
    
    // 이미지 클릭 이벤트 - 메뉴 토글
    let menuOpen = false;
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      
      menuOpen = !menuOpen;
      if (menuOpen) {
        sizeMenu.style.display = 'block';
        img.style.border = '3px solid #3B82F6';
      } else {
        sizeMenu.style.display = 'none';
        img.style.border = '2px solid transparent';
      }
    });
    
    // 외부 클릭시 메뉴 닫기
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        sizeMenu.style.display = 'none';
        img.style.border = '2px solid transparent';
        menuOpen = false;
      }
    });
    
    container.appendChild(img);
    container.appendChild(sizeMenu);
    
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

  decorate(): React.ReactElement {
    return <div style={{ display: 'none' }} />;
  }

  isInline(): false {
    return false;
  }
}

export function $createCustomImageNode(src: string, alt: string, width: string = 'auto', height: string = 'auto'): CustomImageNode {
  return new CustomImageNode(src, alt, width, height);
}

export default function Editor() {
  return (
    <div className="border border-gray-300 rounded bg-white">
      <style jsx global>{`
        /* 커스텀 리스트 타입 스타일 */
        ul[data-list-type="checkbox"] li::before {
          content: "☐ ";
          margin-right: 8px;
          color: #666;
        }
        ul[data-list-type="dash"] li::before {
          content: "- ";
          margin-right: 8px;
          color: #333;
        }
        ul[data-list-type="arrow"] li::before {
          content: "→ ";
          margin-right: 8px;
          color: #333;
        }
        ul[data-list-type="roman"] {
          counter-reset: roman-counter;
        }
        ul[data-list-type="roman"] li {
          counter-increment: roman-counter;
        }
        ul[data-list-type="roman"] li::before {
          content: counter(roman-counter, lower-roman) ". ";
          margin-right: 8px;
          color: #333;
        }
        
        /* 기본 리스트 마커 제거 */
        ul[data-list-type] {
          list-style: none !important;
        }
        ul[data-list-type] li {
          list-style: none !important;
        }
        
        /* 본문 크기 스타일 */
        .editor-paragraph {
          margin-bottom: 0.5rem;
        }
        
        /* data attribute 기반 본문 크기 스타일 */
        p[data-text-size="p1"] {
          font-size: 1.25rem !important;
          line-height: 1.75rem !important;
        }
        
        p[data-text-size="p2"] {
          font-size: 1.125rem !important;
          line-height: 1.75rem !important;
        }
        
        p[data-text-size="p3"] {
          font-size: 1rem !important;
          line-height: 1.5rem !important;
        }
        
        /* 인라인 스타일이 적용된 paragraph를 위한 CSS */
        p[style*="font-size: 1.25rem"] {
          font-size: 1.25rem !important;
          line-height: 1.75rem !important;
        }
        
        p[style*="font-size: 1.125rem"] {
          font-size: 1.125rem !important;
          line-height: 1.75rem !important;
        }
        
        p[style*="font-size: 1rem"] {
          font-size: 1rem !important;
          line-height: 1.5rem !important;
        }
        
        /* ContentEditable 내부의 모든 인라인 스타일 강제 적용 */
        .editor-content p {
          margin-bottom: 0.5rem;
        }
        
        /* 텍스트 색상 및 배경색 스타일 */
        .styled-text {
          display: inline;
        }
        
        /* 코드 블록 스타일 */
        .editor-content code {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 12px 16px;
          display: block;
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          border: 1px solid #e0e0e0;
          margin: 8px 0;
          white-space: pre-wrap;
          overflow-x: auto;
          min-height: 40px;
        }
        
        /* 코드 블록 내부의 br 태그 스타일 */
        .editor-content code br {
          display: block;
          margin: 0;
          padding: 0;
        }
        
        /* 코드 노드 전체 스타일 */
        .editor-content [data-lexical-text="true"] {
          white-space: pre-wrap;
        }
        
        /* Lexical CodeNode 스타일 */
        .editor-content .PlaygroundEditorTheme__code {
          background-color: #f5f5f5 !important;
          border-radius: 8px !important;
          padding: 12px 16px !important;
          display: block !important;
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          color: #333 !important;
          border: 1px solid #e0e0e0 !important;
          margin: 8px 0 !important;
          white-space: pre-wrap !important;
          overflow-x: auto !important;
          min-height: 40px !important;
        }
        
        /* 코드 블록 placeholder 스타일 */
        .editor-content code:empty::before {
          content: '코드를 입력하세요';
          color: #999;
          font-style: italic;
          pointer-events: none;
        }
        
        /* Lexical CodeNode가 비어있을 때 placeholder */
        .editor-content .PlaygroundEditorTheme__code:empty::before {
          content: '코드를 입력하세요';
          color: #999 !important;
          font-style: italic;
          pointer-events: none;
        }
        
        /* CodeNode 내부가 비어있는 경우 */
        .editor-content [data-lexical-code="true"]:empty::before {
          content: '코드를 입력하세요';
          color: #999;
          font-style: italic;
          pointer-events: none;
        }
        
        /* 커스텀 이미지 노드 스타일 */
        .editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 20px 0;
          display: block;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        /* 이미지 컨테이너 스타일 */
        .custom-image-node {
          text-align: center;
          margin: 24px 0;
        }
        
        /* 이미지 노드 앞뒤 paragraph 간격 조정 */
        .editor-content p + div[data-lexical-decorator] {
          margin-top: 20px;
        }
        
        .editor-content div[data-lexical-decorator] + p {
          margin-top: 20px;
        }
      `}</style>
      <div className="p-4">
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="min-h-[400px] outline-none text-black prose max-w-none editor-content" 
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
        <EnterKeyPlugin />
        <HRKeyboardPlugin />
        <ColorPlugin />
        <HtmlExtractPlugin />
      </div>
    </div>
  );
} 