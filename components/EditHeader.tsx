import { $isTextNode, COMMAND_PRIORITY_LOW, createCommand, ElementFormatType, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { TextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection } from 'lexical';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';
import { $createListItemNode, $createListNode, $isListNode, ListNode } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createLinkNode } from '@lexical/link';
import { $createCustomHRNode } from './CustomHRNode';
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import React from 'react';
import { $getRoot } from 'lexical';
import { SET_BG_COLOR_COMMAND, SET_FONT_FAMILY_COMMAND, SET_TEXT_COLOR_COMMAND } from './Editor';
import { $createCustomFileNode, $createCustomImageNode, $createCustomVideoNode } from './Editor';

// 파일 크기 제한 설정
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEO_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 이미지 압축 함수
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.createElement('img') as HTMLImageElement;
    
    img.onload = () => {
      // 최대 너비 1920px로 제한
      const maxWidth = 1920;
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      } else {
        // 압축 실패시 원본 반환
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.readAsDataURL(file);
      }
    };
    
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// 커스텀 TextFormatType 타입 확장
type ExtendedTextFormatType = TextFormatType | string;

// 텍스트 크기 옵션 정의
const textSizeOptions = [
  { label: '제목 1', value: 'h1', size: 'text-4xl font-bold' },
  { label: '제목 2', value: 'h2', size: 'text-3xl font-bold' },
  { label: '제목 3', value: 'h3', size: 'text-2xl font-bold' },
  { label: '본문 1', value: 'p1', size: 'text-xl' },
  { label: '본문 2', value: 'p2', size: 'text-lg' },
  { label: '본문 3', value: 'p3', size: 'text-base' },
];

// 글씨체 옵션 정의
const fontFamilyOptions = [
  { label: '기본', value: 'default', family: 'inherit' },
  { label: '고딕', value: 'sans-serif', family: '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif' },
  { label: '명조', value: 'serif', family: '"Times New Roman", "Batang", serif' },
  { label: '돋움', value: 'dotum', family: '"Dotum", "Apple SD Gothic Neo", sans-serif' },
  { label: '굴림', value: 'gulim', family: '"Gulim", "Apple SD Gothic Neo", sans-serif' },
  { label: '나눔고딕', value: 'nanum', family: '"Nanum Gothic", sans-serif' },
  { label: '모노스페이스', value: 'monospace', family: '"Courier New", "D2Coding", monospace' },
];

const ToolbarButton = ({
  format,
  icon,
  onClick,
  isActive,
  buttonRef,
  style,
}: {
  format: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
  buttonRef?: React.LegacyRef<HTMLButtonElement>;
  style?: React.CSSProperties;
}) => (
  <button
    ref={buttonRef}
    type="button"
    onMouseDown={e => {
      e.preventDefault();
      onClick();
    }}
    className={`px-2 py-1 border border-black rounded mx-1 hover:bg-gray-200 text-black ${
      isActive ? 'bg-gray-200' : 'bg-white'
    }`}
    aria-label={format}
    style={style}
  >
    {icon}
  </button>
);

interface LinkFormProps {
  onSubmit: (text: string, url: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const LinkForm = ({ onSubmit, onClose, position }: LinkFormProps) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">텍스트</label>
          <input
            type="text"
            value={text || ''}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="링크에 표시될 텍스트"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <input
            type="url"
            value={url || ''}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (url) {
                onSubmit(text || url, url);
                setText('');
                setUrl('');
              }
            }}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

interface HrFormProps {
  onSubmit: (style: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const hrStyles = [
  { 
    id: 'solid',
    name: '실선',
    style: 'border-t border-black my-4',
    previewStyle: 'border-t-2 border-black'
  },
  {
    id: 'dashed',
    name: '점선',
    style: 'border-t border-dashed border-black my-4',
    previewStyle: 'border-t-2 border-dashed border-black'
  },
  {
    id: 'dotted',
    name: '점선 (둥근점)',
    style: 'border-t border-dotted border-black my-4',
    previewStyle: 'border-t-2 border-dotted border-black'
  },
  {
    id: 'double',
    name: '이중선',
    style: 'border-t-4 border-double border-black my-4 h-3',
    previewStyle: 'border-t-4 border-double border-black'
  },
  {
    id: 'thick',
    name: '두꺼운 실선',
    style: 'border-t-2 border-black my-4',
    previewStyle: 'border-t-4 border-black'
  }
];

const HrForm = ({ onSubmit, onClose, position }: HrFormProps) => {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">구분선 스타일 선택</h3>
        <div className="space-y-2">
          {hrStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSubmit(style.style)}
              className="w-full p-2 hover:bg-gray-50 rounded-md text-left flex items-center"
            >
              <div className={`flex-1 h-0.5 mx-2 ${style.previewStyle}`} />
              <span className="ml-2 text-sm text-gray-600">{style.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 색상 버튼 관련 인터페이스
interface ColorFormProps {
  onSubmit: (color: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
  title: string;
}

// 색상 목록
const colors = [
  { label: '검정', value: '#000000', preview: 'bg-black' },
  { label: '회색', value: '#6B7280', preview: 'bg-gray-500' },
  { label: '빨강', value: '#EF4444', preview: 'bg-red-500' },
  { label: '주황', value: '#F97316', preview: 'bg-orange-500' },
  { label: '노랑', value: '#EAB308', preview: 'bg-yellow-500' },
  { label: '초록', value: '#22C55E', preview: 'bg-green-500' },
  { label: '파랑', value: '#3B82F6', preview: 'bg-blue-500' },
  { label: '보라', value: '#A855F7', preview: 'bg-purple-500' },
  { label: '분홍', value: '#EC4899', preview: 'bg-pink-500' },
];

const bgColors = [
  { label: '투명', value: 'transparent', preview: 'bg-transparent border border-gray-200' },
  { label: '회색', value: '#F3F4F6', preview: 'bg-gray-100' },
  { label: '빨강', value: '#FEE2E2', preview: 'bg-red-100' },
  { label: '주황', value: '#FFEDD5', preview: 'bg-orange-100' },
  { label: '노랑', value: '#FEF3C7', preview: 'bg-yellow-100' },
  { label: '초록', value: '#DCFCE7', preview: 'bg-green-100' },
  { label: '파랑', value: '#DBEAFE', preview: 'bg-blue-100' },
  { label: '보라', value: '#F3E8FF', preview: 'bg-purple-100' },
  { label: '분홍', value: '#FCE7F3', preview: 'bg-pink-100' },
];

const ColorForm = ({ onSubmit, onClose, position, title }: ColorFormProps) => {
  const formRef = useRef<HTMLDivElement>(null);
  const [customColor, setCustomColor] = useState('#000000');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  const colorList = title.includes('배경') ? bgColors : colors;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="grid grid-cols-3 gap-2">
          {colorList.map((color, index) => (
            <button
              key={index}
              onClick={() => onSubmit(color.value)}
              className="flex items-center justify-center p-2 rounded hover:bg-gray-50"
            >
              <div
                className={`w-6 h-6 rounded ${color.preview}`}
              />
              <span className="ml-2 text-sm text-gray-600">{color.label}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            사용자 정의 색상
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor || '#000000'}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-8 p-0 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={customColor || ''}
              onChange={(e) => setCustomColor(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="#000000"
            />
            <button
              onClick={() => onSubmit(customColor)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ListFormProps {
  onSubmit: (type: 'bullet' | 'number' | 'checkbox' | 'dash' | 'arrow' | 'roman') => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const listTypes = [
  { 
    id: 'bullet',
    name: '글머리 기호',
    type: 'bullet' as const,
    icon: 'bi-dot',
    preview: '• 항목 1\n• 항목 2\n• 항목 3'
  },
  {
    id: 'number',
    name: '번호 매기기',
    type: 'number' as const,
    icon: 'bi-list-ol',
    preview: '1. 항목 1\n2. 항목 2\n3. 항목 3'
  },
  {
    id: 'checkbox',
    name: '체크박스 목록',
    type: 'checkbox' as const,
    icon: 'bi-check-square',
    preview: '☐ 할 일 1\n☐ 할 일 2\n☐ 할 일 3'
  },
  {
    id: 'dash',
    name: '대시 목록',
    type: 'dash' as const,
    icon: 'bi-dash',
    preview: '- 항목 1\n- 항목 2\n- 항목 3'
  },
  {
    id: 'arrow',
    name: '화살표 목록',
    type: 'arrow' as const,
    icon: 'bi-arrow-right',
    preview: '→ 항목 1\n→ 항목 2\n→ 항목 3'
  },
  {
    id: 'roman',
    name: '로마 숫자',
    type: 'roman' as const,
    icon: 'bi-list-nested',
    preview: 'i. 항목 1\nii. 항목 2\niii. 항목 3'
  }
];

const ListForm = ({ onSubmit, onClose, position }: ListFormProps) => {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 px-1">리스트 타입 선택</h3>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {listTypes.map((listType) => (
            <button
              key={listType.id}
              onClick={() => onSubmit(listType.type)}
              className="w-full p-2 hover:bg-gray-50 rounded-md text-left flex items-center border border-gray-100 transition-colors"
            >
              <i className={`bi ${listType.icon} text-base mr-2 flex-shrink-0`}></i>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs">{listType.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 whitespace-pre-line leading-tight">
                  {listType.preview}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ImageFormProps {
  onSubmit: (src: string, alt: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const ImageForm = ({ onSubmit, onClose, position }: ImageFormProps) => {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // uploadType이 변경될 때 상태 초기화
  useEffect(() => {
    setImageUrl('');
    setAltText('');
    // file input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`이미지 파일이 너무 큽니다. 최대 ${formatFileSize(MAX_IMAGE_SIZE)}까지 허용됩니다.\n현재 크기: ${formatFileSize(file.size)}\n\n자동으로 압축을 시도합니다.`);
      }
      
      // 이미지 압축
      if (file.type.startsWith('image/')) {
        compressImage(file).then((compressedDataUrl) => {
          setImageUrl(compressedDataUrl);
          setAltText(file.name.split('.')[0] || '');
          
          // 압축 후 크기 확인
          const compressedSize = compressedDataUrl.length * 0.75; // Base64 크기 추정
          if (compressedSize > MAX_IMAGE_SIZE) {
            alert(`압축 후에도 파일이 큽니다. 더 작은 이미지를 사용해주세요.\n압축 후 크기: ${formatFileSize(compressedSize)}`);
          }
        });
      } else {
        // 이미지가 아닌 경우 원본 사용
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImageUrl(result || '');
          setAltText(file.name.split('.')[0] || '');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = () => {
    if (imageUrl) {
      onSubmit(imageUrl, altText || '이미지');
      setImageUrl('');
      setAltText('');
      // file input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">이미지 추가</h3>
        
        {/* 업로드 타입 선택 */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setUploadType('url');
            }}
            className={`px-3 py-1.5 text-sm rounded ${
              uploadType === 'url' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            URL
          </button>
          <button
            onClick={() => {
              setUploadType('file');
            }}
            className={`px-3 py-1.5 text-sm rounded ${
              uploadType === 'file' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            파일 업로드
          </button>
        </div>

        {uploadType === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이미지 URL</label>
            <input
              type="url"
              value={imageUrl || ''}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 선택</label>
            <input
              key={uploadType}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">대체 텍스트</label>
          <input
            type="text"
            value={altText || ''}
            onChange={(e) => setAltText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이미지 설명"
          />
        </div>

        {/* 이미지 미리보기 */}
        {imageUrl && (
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">미리보기:</p>
            <img 
              src={imageUrl} 
              alt={altText || '미리보기'} 
              className="max-w-full h-24 object-cover rounded border"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!imageUrl}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

// 미디어 드롭다운 관련 인터페이스
interface MediaDropdownProps {
  onSelect: (type: 'image' | 'file' | 'video') => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const mediaOptions = [
  { 
    id: 'image',
    name: '사진',
    type: 'image' as const,
    icon: 'bi-image',
    description: 'JPG, PNG, GIF 등의 이미지 파일'
  },
  {
    id: 'file',
    name: '파일',
    type: 'file' as const,
    icon: 'bi-file-earmark',
    description: 'PDF, DOC, TXT 등의 일반 파일'
  },
  {
    id: 'video',
    name: '영상',
    type: 'video' as const,
    icon: 'bi-camera-video',
    description: 'MP4, AVI, MOV 등의 동영상 파일'
  }
];

const MediaDropdown = ({ onSelect, onClose, position }: MediaDropdownProps) => {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-64"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-700 px-2 py-1">미디어 타입 선택</h3>
        {mediaOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.type)}
            className="w-full p-2 hover:bg-gray-50 rounded-md text-left flex items-center border border-gray-100 transition-colors"
          >
            <i className={`bi ${option.icon} text-base mr-3 flex-shrink-0 text-blue-600`}></i>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{option.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {option.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

interface FileFormProps {
  onSubmit: (file: File, fileName: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const FileForm = ({ onSubmit, onClose, position }: FileFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크
      if (file.size > MAX_FILE_SIZE) {
        alert(`파일이 너무 큽니다. 최대 ${formatFileSize(MAX_FILE_SIZE)}까지 허용됩니다.\n현재 크기: ${formatFileSize(file.size)}`);
        return;
      }
      
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile, fileName || selectedFile.name);
      setSelectedFile(null);
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">파일 업로드</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">파일 선택</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">표시 이름</label>
          <input
            type="text"
            value={fileName || ''}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="파일 이름"
          />
        </div>

        {selectedFile && (
          <div className="mt-3 p-2 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">선택된 파일:</p>
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

interface VideoFormProps {
  onSubmit: (src: string, alt: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const VideoForm = ({ onSubmit, onClose, position }: VideoFormProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    setVideoUrl('');
    setAltText('');
    setSelectedVideo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 비디오 파일 크기 체크
      if (file.size > MAX_VIDEO_SIZE) {
        alert(`비디오 파일이 너무 큽니다. 최대 ${formatFileSize(MAX_VIDEO_SIZE)}까지 허용됩니다.\n현재 크기: ${formatFileSize(file.size)}`);
        return;
      }
      
      setSelectedVideo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setVideoUrl(result || '');
        setAltText(file.name.split('.')[0] || '');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (videoUrl) {
      onSubmit(videoUrl, altText || '비디오');
      setVideoUrl('');
      setAltText('');
      setSelectedVideo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
      style={{ 
        top: `${position.top}px`,
        left: `${position.left - 100}px`
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">비디오 추가</h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setUploadType('url')}
            className={`px-3 py-1.5 text-sm rounded ${
              uploadType === 'url' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            URL
          </button>
          <button
            onClick={() => setUploadType('file')}
            className={`px-3 py-1.5 text-sm rounded ${
              uploadType === 'file' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            파일 업로드
          </button>
        </div>

        {uploadType === 'url' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비디오 URL</label>
            <input
              type="url"
              value={videoUrl || ''}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/video.mp4"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 선택</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
          <input
            type="text"
            value={altText || ''}
            onChange={(e) => setAltText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="비디오 설명"
          />
        </div>

        {selectedVideo && uploadType === 'file' && (
          <div className="mt-3 p-2 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">선택된 파일:</p>
            <p className="text-sm font-medium">{selectedVideo.name}</p>
            <p className="text-xs text-gray-500">{(selectedVideo.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!videoUrl}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EditHeader() {
  const [editor] = useLexicalComposerContext();
  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [blockType, setBlockType] = useState<string>('paragraph');
  const [currentTextSize, setCurrentTextSize] = useState<string>('p3');
  const [currentFontFamily, setCurrentFontFamily] = useState<string>('default');
  const [linkFormPosition, setLinkFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [hrFormPosition, setHrFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [listFormPosition, setListFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [textColorFormPosition, setTextColorFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [bgColorFormPosition, setBgColorFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [imageFormPosition, setImageFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [mediaDropdownPosition, setMediaDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [fileFormPosition, setFileFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [videoFormPosition, setVideoFormPosition] = useState<{ top: number; left: number } | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const hrButtonRef = useRef<HTMLButtonElement>(null);
  const listButtonRef = useRef<HTMLButtonElement>(null);
  const textColorButtonRef = useRef<HTMLButtonElement>(null);
  const bgColorButtonRef = useRef<HTMLButtonElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const styles = new Set<string>();
        if (selection.hasFormat('bold')) styles.add('bold');
        if (selection.hasFormat('italic')) styles.add('italic');
        if (selection.hasFormat('underline')) styles.add('underline');
        if (selection.hasFormat('strikethrough')) styles.add('strikethrough');

        setActiveStyles(styles);
        
        // 현재 블록 타입 감지
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getKey() === 'root' 
          ? anchorNode 
          : anchorNode.getTopLevelElementOrThrow();
        
        if (element.getType() === 'heading') {
          const headingNode = element as any;
          setCurrentTextSize(headingNode.getTag());
          setBlockType('heading');
        } else if (element.getType() === 'paragraph') {
          // paragraph의 스타일을 확인하여 크기 결정
          const paragraphNode = element as any;
          const style = paragraphNode.getStyle() || '';
          
          if (style.includes('font-size: 1.25rem')) {
            setCurrentTextSize('p1');
          } else if (style.includes('font-size: 1.125rem')) {
            setCurrentTextSize('p2');
          } else {
            setCurrentTextSize('p3');
          }
          setBlockType('paragraph');
        } else {
          setCurrentTextSize('p3');
          setBlockType('paragraph');
        }

        // 글씨체 감지
        const selectedNodes = selection.getNodes();
        if (selectedNodes.length > 0) {
          const firstNode = selectedNodes[0];
          
          // 텍스트 노드에서 스타일 확인
          if ($isTextNode(firstNode)) {
            const style = firstNode.getStyle() || '';
            const fontFamilyMatch = style.match(/font-family:\s*([^;]+)/);
            
            if (fontFamilyMatch) {
              const fontFamily = fontFamilyMatch[1].replace(/['"]/g, '').trim();
              
              // 정의된 글씨체 옵션과 매칭
              const matchedOption = fontFamilyOptions.find(option => 
                option.family.includes(fontFamily) || fontFamily.includes(option.value)
              );
              
              setCurrentFontFamily(matchedOption ? matchedOption.value : 'default');
            } else {
              setCurrentFontFamily('default');
            }
          } else {
            setCurrentFontFamily('default');
          }
        }
      });
    });
  }, [editor]);

  const handleFormat = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as TextFormatType);
  };

  const handleAlignment = (alignment: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const handleTextSize = (size: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (size === 'h1' || size === 'h2' || size === 'h3') {
        // 헤딩으로 변환
        $setBlocksType(selection, () => $createHeadingNode(size as HeadingTagType));
      } else {
        // 본문으로 변환 (paragraph)
        $setBlocksType(selection, () => {
          const paragraph = $createParagraphNode();
          
          // 본문 크기에 따른 인라인 스타일 적용
          if (size === 'p1') {
            paragraph.setStyle('font-size: 1.25rem; line-height: 1.75rem;'); // text-xl
          } else if (size === 'p2') {
            paragraph.setStyle('font-size: 1.125rem; line-height: 1.75rem;'); // text-lg
          } else { // p3
            paragraph.setStyle('font-size: 1rem; line-height: 1.5rem;'); // text-base
          }
          
          return paragraph;
        });
        
        // DOM에 추가 속성 설정 (스타일 적용 후)
        setTimeout(() => {
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const anchorNode = selection.anchor.getNode();
              const element = anchorNode.getKey() === 'root' 
                ? anchorNode 
                : anchorNode.getTopLevelElementOrThrow();
              
              const domElement = editor.getElementByKey(element.getKey());
              if (domElement && element.getType() === 'paragraph') {
                domElement.setAttribute('data-text-size', size);
              }
            }
          });
        }, 10);
      }
    });
    setCurrentTextSize(size);
  };

  const handleList = () => {
    if (listButtonRef.current) {
      const rect = listButtonRef.current.getBoundingClientRect();
      setListFormPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleListSubmit = (type: 'bullet' | 'number' | 'checkbox' | 'dash' | 'arrow' | 'roman') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const nodes = selection.getNodes();
      const firstNode = nodes[0];
      const firstNodeParent = firstNode.getParent();

      if ($isListNode(firstNodeParent)) {
        // 이미 리스트인 경우, 리스트를 제거하고 일반 텍스트로 변환
        const paragraphs = nodes.map(node => {
          const text = node.getTextContent();
          const paragraph = $createParagraphNode();
          const textNode = $createTextNode(text);
          paragraph.append(textNode);
          return paragraph;
        });

        firstNodeParent.replace(paragraphs[0]);
        for (let i = 1; i < paragraphs.length; i++) {
          paragraphs[i - 1].insertAfter(paragraphs[i]);
        }
      } else {
        // 일반 텍스트를 리스트로 변환
        let listNode;
        if (type === 'bullet' || type === 'number') {
          // 기본 Lexical 리스트 타입
          listNode = $createListNode(type);
        } else {
          // 커스텀 리스트 타입들은 bullet으로 생성
          listNode = $createListNode('bullet');
        }
        
        const listItemNode = $createListItemNode();
        listItemNode.append($createTextNode(firstNode.getTextContent()));
        listNode.append(listItemNode);
        firstNode.replace(listNode);
        
        // 커스텀 타입의 경우 DOM에 data attribute 추가 (update 완료 후)
        if (type !== 'bullet' && type !== 'number') {
          setTimeout(() => {
            const domElement = editor.getElementByKey(listNode.getKey());
            if (domElement) {
              domElement.setAttribute('data-list-type', type);
            }
          }, 0);
        }
      }
    });
    setListFormPosition(null);
  };

  const handleLink = () => {
    if (linkButtonRef.current) {
      const rect = linkButtonRef.current.getBoundingClientRect();
      setLinkFormPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleLinkSubmit = (text: string, url: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const linkNode = $createLinkNode(url);
      linkNode.append($createTextNode(text));
      selection.insertNodes([linkNode]);
    });
    setLinkFormPosition(null);
  };

  const handleDivider = () => {
    if (hrButtonRef.current) {
      const rect = hrButtonRef.current.getBoundingClientRect();
      setHrFormPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleHrSubmit = (style: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const hrNode = $createCustomHRNode(style);
      selection.insertNodes([hrNode]);
    });
    setHrFormPosition(null);
  };

  const handleTextColor = () => {
    if (textColorButtonRef.current) {
      const rect = textColorButtonRef.current.getBoundingClientRect();
      setTextColorFormPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleBgColor = () => {
    if (bgColorButtonRef.current) {
      const rect = bgColorButtonRef.current.getBoundingClientRect();
      setBgColorFormPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleTextColorSubmit = (color: string) => {
    editor.dispatchCommand(SET_TEXT_COLOR_COMMAND, color);
    setTextColorFormPosition(null);
  };

  const handleBgColorSubmit = (color: string) => {
    editor.dispatchCommand(SET_BG_COLOR_COMMAND, color);
    setBgColorFormPosition(null);
  };

  const handleFontFamily = (fontValue: string) => {
    const fontOption = fontFamilyOptions.find(option => option.value === fontValue);
    if (!fontOption) return;

    const fontFamily = fontValue === 'default' ? '' : fontOption.family;
    editor.dispatchCommand(SET_FONT_FAMILY_COMMAND, fontFamily);
    setCurrentFontFamily(fontValue);
  };

  const handleImage = () => {
    if (imageButtonRef.current) {
      const rect = imageButtonRef.current.getBoundingClientRect();
      setMediaDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleMediaSelect = (type: 'image' | 'file' | 'video') => {
    setMediaDropdownPosition(null);
    
    if (imageButtonRef.current) {
      const rect = imageButtonRef.current.getBoundingClientRect();
      const position = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      };
      
      switch (type) {
        case 'image':
          setImageFormPosition(position);
          break;
        case 'file':
          setFileFormPosition(position);
          break;
        case 'video':
          setVideoFormPosition(position);
          break;
      }
    }
  };

  const handleImageSubmit = (src: string, alt: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 이미지 앞에 빈 paragraph 추가
      const beforeParagraph = $createParagraphNode();
      beforeParagraph.append($createTextNode(''));
      
      // 실제 이미지 노드 생성
      const imageNode = $createCustomImageNode(src, alt);
      
      // 이미지 뒤에 빈 paragraph 추가
      const afterParagraph = $createParagraphNode();
      afterParagraph.append($createTextNode(''));

      // 노드들 삽입
      selection.insertNodes([beforeParagraph, imageNode, afterParagraph]);
      
      // 이미지 뒤의 paragraph로 커서 이동
      afterParagraph.selectEnd();
    });
    setImageFormPosition(null);
  };

  const handleFileSubmit = (file: File, fileName: string) => {
    // 파일을 Base64로 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target?.result as string;
      const fileExtension = file.name.split('.').pop() || '';
      
      // 에디터 업데이트 내부에서 노드 생성
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        
        // 파일 노드 생성 (fileName, fileSize, fileType, fileData)
        const fileNode = $createCustomFileNode(fileName, file.size, fileExtension, fileData);
        
        // 파일 앞뒤에 빈 paragraph 추가
        const beforeParagraph = $createParagraphNode();
        beforeParagraph.append($createTextNode(''));
        
        const afterParagraph = $createParagraphNode();
        afterParagraph.append($createTextNode(''));

        selection.insertNodes([beforeParagraph, fileNode, afterParagraph]);
        afterParagraph.selectEnd();
      });
    };
    reader.readAsDataURL(file);
    setFileFormPosition(null);
  };

  const handleVideoSubmit = (src: string, alt: string) => {
    // URL인 경우 바로 처리
    if (src.startsWith('http') || src.startsWith('data:')) {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // 비디오 노드 생성
        const videoNode = $createCustomVideoNode(src, alt);
        
        // 비디오 앞뒤에 빈 paragraph 추가
        const beforeParagraph = $createParagraphNode();
        beforeParagraph.append($createTextNode(''));
        
        const afterParagraph = $createParagraphNode();
        afterParagraph.append($createTextNode(''));

        selection.insertNodes([beforeParagraph, videoNode, afterParagraph]);
        afterParagraph.selectEnd();
      });
    }
    setVideoFormPosition(null);
  };

  const handleCode = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 빈 코드블록 노드 생성 (placeholder는 CSS로 처리)
      const codeNode = $createCodeNode();
      selection.insertNodes([codeNode]);
    });
  };

  const handlePlugin = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 플러그인 플레이스홀더 텍스트 삽입
      const pluginText = '[플러그인]';
      const textNode = $createTextNode(pluginText);
      selection.insertNodes([textNode]);
    });
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          <Link href="/" className="text-black hover:text-gray-600">
            <i className="bi bi-arrow-left text-xl"></i>
          </Link>
          <span className="text-lg font-semibold px-4 py-2">글쓰기</span>
        </div>
        
        {/* 텍스트 크기 선택 드롭다운 */}
        <div className="flex items-center space-x-1 ml-8">
          <ToolbarButton
            format="image"
            icon={<i className="bi bi-image"></i>}
            onClick={handleImage}
            isActive={false}
            buttonRef={imageButtonRef}
          />
          
          <select
            value={currentTextSize}
            onChange={(e) => handleTextSize(e.target.value)}
            className="px-2 py-1 border border-black rounded text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 h-8"
          >
            {textSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* 글씨체 선택 드롭다운 */}
          <select
            value={currentFontFamily}
            onChange={(e) => handleFontFamily(e.target.value)}
            className="px-2 py-1 border border-black rounded text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 h-8"
          >
            {fontFamilyOptions.map((option) => (
              <option key={option.value} value={option.value} style={{ fontFamily: option.family }}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="mx-2 h-6 border-l border-gray-300" />
          
          <ToolbarButton
            format="bold"
            icon={<i className="bi bi-type-bold"></i>}
            onClick={() => handleFormat('bold')}
            isActive={activeStyles.has('bold')}
          />
          <ToolbarButton
            format="italic"
            icon={<i className="bi bi-type-italic"></i>}
            onClick={() => handleFormat('italic')}
            isActive={activeStyles.has('italic')}
          />
          <ToolbarButton
            format="underline"
            icon={<i className="bi bi-type-underline"></i>}
            onClick={() => handleFormat('underline')}
            isActive={activeStyles.has('underline')}
          />
          <ToolbarButton
            format="strikethrough"
            icon={<i className="bi bi-type-strikethrough"></i>}
            onClick={() => handleFormat('strikethrough')}
            isActive={activeStyles.has('strikethrough')}
          />
          <div className="mx-2 h-6 border-l border-gray-300" />
          <ToolbarButton
            format="textColor"
            icon={<i className="bi bi-pencil"></i>}
            onClick={handleTextColor}
            isActive={false}
            buttonRef={textColorButtonRef}
          />
          <ToolbarButton
            format="bgColor"
            icon={<i className="bi bi-paint-bucket"></i>}
            onClick={handleBgColor}
            isActive={false}
            buttonRef={bgColorButtonRef}
          />
          <div className="mx-2 h-6 border-l border-gray-300" />
          <ToolbarButton
            format="left"
            icon={<i className="bi bi-text-left"></i>}
            onClick={() => handleAlignment('left')}
            isActive={false}
          />
          <ToolbarButton
            format="center"
            icon={<i className="bi bi-text-center"></i>}
            onClick={() => handleAlignment('center')}
            isActive={false}
          />
          <ToolbarButton
            format="right"
            icon={<i className="bi bi-text-right"></i>}
            onClick={() => handleAlignment('right')}
            isActive={false}
          />
          <ToolbarButton
            format="justify"
            icon={<i className="bi bi-justify"></i>}
            onClick={() => handleAlignment('justify')}
            isActive={false}
          />
          <div className="mx-2 h-6 border-l border-gray-300" />
          <ToolbarButton
            format="list"
            icon={<i className="bi bi-list-ul"></i>}
            onClick={handleList}
            isActive={false}
            buttonRef={listButtonRef}
          />
          <ToolbarButton
            format="link"
            icon={<i className="bi bi-link-45deg"></i>}
            onClick={handleLink}
            isActive={false}
            buttonRef={linkButtonRef}
          />
          <ToolbarButton
            format="divider"
            icon={<i className="bi bi-hr"></i>}
            onClick={handleDivider}
            isActive={false}
            buttonRef={hrButtonRef}
          />
          <ToolbarButton
            format="code"
            icon={<i className="bi bi-code"></i>}
            onClick={handleCode}
            isActive={false}
          />
          <ToolbarButton
            format="plugin"
            icon={<i className="bi bi-plugin"></i>}
            onClick={handlePlugin}
            isActive={false}
          />
        </div>
      </div>
      
      {linkFormPosition && (
        <LinkForm
          onSubmit={handleLinkSubmit}
          onClose={() => setLinkFormPosition(null)}
          position={linkFormPosition}
        />
      )}
      {hrFormPosition && (
        <HrForm
          onSubmit={handleHrSubmit}
          onClose={() => setHrFormPosition(null)}
          position={hrFormPosition}
        />
      )}
      {listFormPosition && (
        <ListForm
          onSubmit={handleListSubmit}
          onClose={() => setListFormPosition(null)}
          position={listFormPosition}
        />
      )}
      {textColorFormPosition && (
        <ColorForm
          onSubmit={handleTextColorSubmit}
          onClose={() => setTextColorFormPosition(null)}
          position={textColorFormPosition}
          title="텍스트 색상"
        />
      )}
      {bgColorFormPosition && (
        <ColorForm
          onSubmit={handleBgColorSubmit}
          onClose={() => setBgColorFormPosition(null)}
          position={bgColorFormPosition}
          title="배경 색상"
        />
      )}
      {imageFormPosition && (
        <ImageForm
          onSubmit={handleImageSubmit}
          onClose={() => setImageFormPosition(null)}
          position={imageFormPosition}
        />
      )}
      {mediaDropdownPosition && (
        <MediaDropdown
          onSelect={handleMediaSelect}
          onClose={() => setMediaDropdownPosition(null)}
          position={mediaDropdownPosition}
        />
      )}
      {fileFormPosition && (
        <FileForm
          onSubmit={handleFileSubmit}
          onClose={() => setFileFormPosition(null)}
          position={fileFormPosition}
        />
      )}
      {videoFormPosition && (
        <VideoForm
          onSubmit={handleVideoSubmit}
          onClose={() => setVideoFormPosition(null)}
          position={videoFormPosition}
        />
      )}
    </div>
  );
} 