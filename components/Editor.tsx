"use client";
import React, { useEffect, useState } from "react";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { $patchStyleText } from '@lexical/selection';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createParagraphNode, $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, CLICK_COMMAND, COMMAND_PRIORITY_LOW, createCommand, KEY_BACKSPACE_COMMAND, KEY_ENTER_COMMAND } from 'lexical';
import { $getRoot } from 'lexical';
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';

import { CustomHRNode } from "./CustomHRNode";

import "bootstrap-icons/font/bootstrap-icons.css";

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

  useEffect(() => {
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
      COMMAND_PRIORITY_LOW
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
    return new CustomFileNode(
      node.__fileName,
      node.__fileSize,
      node.__fileType,
      node.__fileData,
      node.__key
    );
  }

  constructor(
    fileName: string,
    fileSize: number,
    fileType: string,
    fileData: string,
    key?: NodeKey
  ) {
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

export function $createCustomFileNode(
  fileName: string,
  fileSize: number,
  fileType: string,
  fileData: string
): CustomFileNode {
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
    return new CustomVideoNode(
      node.__src,
      node.__alt,
      node.__width,
      node.__height,
      node.__key
    );
  }

  constructor(
    src: string,
    alt: string,
    width: string = '100%',
    height: string = 'auto',
    key?: NodeKey
  ) {
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
    
    const videoCard = document.createElement('div');
    videoCard.style.display = 'inline-block';
    videoCard.style.maxWidth = '100%';
    videoCard.style.border = '2px solid #e5e5e5';
    videoCard.style.borderRadius = '8px';
    videoCard.style.overflow = 'hidden';
    videoCard.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
    videoCard.style.backgroundColor = '#000';
    
    const video = document.createElement('video');
    video.src = this.__src;
    video.style.width = this.__width;
    video.style.height = this.__height;
    video.style.maxWidth = '100%';
    video.style.display = 'block';
    video.controls = true;
    video.preload = 'metadata';
    
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
    
    // 크기 조절 메뉴 (이미지와 유사)
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
    title.textContent = '비디오 크기';
    title.style.margin = '0 0 8px 0';
    title.style.fontSize = '14px';
    title.style.fontWeight = 'bold';
    sizeMenu.appendChild(title);
    
    // 크기 옵션들
    const sizeOptions = [
      { label: '작게 (50%)', value: '50%' },
      { label: '보통 (75%)', value: '75%' },
      { label: '크게 (100%)', value: '100%' },
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
        
        // 비디오 크기 업데이트
        video.style.width = option.value;
        
        // 현재 크기 표시 업데이트
        currentSize.textContent = `현재 크기: ${option.value} × auto`;
        
        // 메뉴 닫기
        sizeMenu.style.display = 'none';
        videoCard.style.border = '2px solid #e5e5e5';
      });
      
      sizeMenu.appendChild(button);
    });
    
    sizeMenu.appendChild(currentSize);
    
    // 비디오 클릭 이벤트 - 메뉴 토글
    let menuOpen = false;
    videoCard.addEventListener('click', (e) => {
      e.stopPropagation();
      
      menuOpen = !menuOpen;
      if (menuOpen) {
        sizeMenu.style.display = 'block';
        videoCard.style.border = '3px solid #3B82F6';
      } else {
        sizeMenu.style.display = 'none';
        videoCard.style.border = '2px solid #e5e5e5';
      }
    });
    
    // 외부 클릭시 메뉴 닫기
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        sizeMenu.style.display = 'none';
        videoCard.style.border = '2px solid #e5e5e5';
        menuOpen = false;
      }
    });
    
    container.appendChild(videoCard);
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

export function $createCustomVideoNode(
  src: string,
  alt: string,
  width: string = '100%',
  height: string = 'auto'
): CustomVideoNode {
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

export default function Editor() {
  const [defaultFontFamily, setDefaultFontFamily] = useState('inherit');
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerCommand(
      SET_FONT_FAMILY_COMMAND,
      (fontFamily: string) => {
        setDefaultFontFamily(fontFamily || 'inherit');
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  return (
    <div className="border border-gray-300 rounded bg-white">
      <style jsx global>{`
        /* 웹 폰트 추가 */
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Nanum+Myeongjo:wght@400;700&display=swap');
        
        /* 기존 스타일 유지 */
        
        /* 글꼴 관련 스타일 */
        .editor-content {
          font-family: ${defaultFontFamily};
        }
        
        .editor-content [style*="font-family"] {
          font-family: inherit;
        }

        /* 링크 스타일 */
        .editor-content a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          pointer-events: all !important;
        }

        .editor-content a:hover {
          color: #1d4ed8;
        }

        /* 코드 블럭 스타일 - 모든 코드를 블럭 형태로 */
        .editor-content code {
          display: block;
          background-color: #f1f5f9;
          color: #475569;
          padding: 16px;
          border-radius: 8px;
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Ubuntu Mono', monospace !important;
          font-size: 14px !important;
          border: 1px solid #e2e8f0;
          margin: 16px 0;
          overflow-x: auto;
          line-height: 1.4;
          white-space: pre-wrap;
          font-weight: normal !important;
        }

        .editor-content pre {
          background-color: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
          font-family: 'Courier New', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'Ubuntu Mono', monospace !important;
          font-size: 14px !important;
          line-height: 1.4;
          font-weight: normal !important;
        }

        .editor-content pre code {
          display: block;
          background-color: transparent;
          border: none;
          padding: 0;
          margin: 0;
          color: #475569;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
        }

        /* 글꼴 스타일 보완 */
        @font-face {
          font-family: 'NanumGothic';
          src: local('Nanum Gothic');
        }

        @font-face {
          font-family: 'NanumMyeongjo';
          src: local('Nanum Myeongjo');
        }
      `}</style>
      <div className="p-4">
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="min-h-[400px] outline-none text-black prose max-w-none editor-content"
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <LinkClickPlugin />
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