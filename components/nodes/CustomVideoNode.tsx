import { DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { $getRoot } from 'lexical';
import React from 'react';

// 비디오 노드 관련 타입
export type SerializedVideoNode = Spread<
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
    let aspectRatio = 16 / 9; // 기본 비율

    // 비디오 선택 상태 토글
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
        newHeight = Math.min(newHeight, maxWidth / aspectRatio);

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
            const currentNode = videoNodes.find((node) => node.__src === this.__src);

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
