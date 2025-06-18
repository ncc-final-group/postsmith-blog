import { DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical';
import React from 'react';

// 이미지 노드 관련 타입
export type SerializedImageNode = Spread<
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
        handles.forEach((handleInfo) => {
          const handle = resizeContainer.querySelector(`[data-handle="${handleInfo.position}"]`) as HTMLElement;
          if (handle) {
            handle.style.display = 'block';
          }
        });
      } else {
        resizeContainer.style.border = '2px solid transparent';
        handles.forEach((handleInfo) => {
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
          document.querySelectorAll('.drop-indicator').forEach((indicator) => {
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
                  const newImageNode = $createCustomImageNode(imageNode.__src, imageNode.__alt, imageNode.__width, imageNode.__height, imageNode.__mediaId, imageNode.__alignment);

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
        document.querySelectorAll('.drop-indicator').forEach((indicator) => {
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
    handles.forEach((handleInfo) => {
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
        newHeight = Math.min(newHeight, maxWidth / aspectRatio);

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
            const currentNode = imageNodes.find((node) => node.__src === this.__src);

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
    return this.__alignment !== prevNode.__alignment || this.__width !== prevNode.__width || this.__height !== prevNode.__height;
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

export function $isCustomImageNode(node: LexicalNode | null | undefined): node is CustomImageNode {
  return node instanceof CustomImageNode;
}

export function $createCustomImageNode(
  src: string,
  alt: string,
  width: string = 'auto',
  height: string = 'auto',
  mediaId?: number,
  alignment: 'left' | 'center' | 'right' = 'center',
): CustomImageNode {
  return new CustomImageNode(src, alt, width, height, mediaId, alignment);
}


