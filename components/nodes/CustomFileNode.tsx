import { DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import React from 'react';

// 파일 노드 관련 타입
export type SerializedFileNode = Spread<
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
