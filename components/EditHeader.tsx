'use client';

import { $createCodeNode } from '@lexical/code';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createListItemNode, $createListNode, $isListItemNode, $isListNode, ListNode } from '@lexical/list';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, HeadingTagType } from '@lexical/rich-text';
import { $patchStyleText, $setBlocksType } from '@lexical/selection';
import { $isTextNode, COMMAND_PRIORITY_LOW, createCommand, ElementFormatType, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { $createParagraphNode, $createTextNode, $getSelection, $isParagraphNode, $isRangeSelection, TextNode } from 'lexical';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { $createCustomHRNode } from './CustomHRNode';

import 'bootstrap-icons/font/bootstrap-icons.css';
import React from 'react';
import { $getRoot } from 'lexical';

import { SET_BG_COLOR_COMMAND, SET_FONT_FAMILY_COMMAND, SET_IMAGE_ALIGNMENT_COMMAND, SET_TEXT_COLOR_COMMAND } from './Editor';
import { $createCustomFileNode, $createCustomImageNode, $createCustomVideoNode } from './nodes';
import { getMediaFiles, type MediaFile } from '../lib/mediaService';
import { uploadFileToServer, uploadImageToServer, uploadVideoToServer } from '../lib/uploadService';
import { useBlogStore } from '../app/store/blogStore';

// 파일 크기 포맷팅
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

// 글꼴 옵션 수정
const fontFamilyOptions = [
  { label: '기본', value: 'default', family: 'inherit' },
  { label: '돋움', value: 'dotum', family: 'Dotum, 돋움, sans-serif' },
  { label: '굴림', value: 'gulim', family: 'Gulim, 굴림, sans-serif' },
  { label: '나눔고딕', value: 'nanumgothic', family: 'NanumGothic, 나눔고딕, sans-serif' },
  { label: '나눔명조', value: 'nanummyeongjo', family: 'NanumMyeongjo, 나눔명조, serif' },
  { label: '맑은 고딕', value: 'malgun', family: 'Malgun Gothic, 맑은 고딕, sans-serif' },
  { label: '바탕', value: 'batang', family: 'Batang, 바탕, serif' },
  { label: '궁서', value: 'gungsuh', family: 'Gungsuh, 궁서, serif' },
];

// 툴팁 정보 정의
const getToolTipInfo = (format: string): { title: string; description: string } => {
  const tooltips: Record<string, { title: string; description: string }> = {
    image: { title: '파일', description: '이미지, 동영상, 파일 삽입' },
    bold: { title: '굵게', description: '텍스트를 굵게 표시' },
    italic: { title: '기울임', description: '텍스트를 기울임꼴로 표시' },
    underline: { title: '밑줄', description: '텍스트에 밑줄 추가' },
    strikethrough: { title: '취소선', description: '텍스트에 취소선 추가' },
    textColor: { title: '글자 색상', description: '텍스트 색상 변경' },
    bgColor: { title: '배경 색상', description: '텍스트 배경색 변경' },
    left: { title: '왼쪽 정렬', description: '텍스트를 왼쪽으로 정렬' },
    center: { title: '가운데 정렬', description: '텍스트를 가운데로 정렬' },
    right: { title: '오른쪽 정렬', description: '텍스트를 오른쪽으로 정렬' },
    justify: { title: '양쪽 정렬', description: '텍스트를 양쪽으로 정렬' },
    list: { title: '목록', description: '목록 형식 삽입' },
    link: { title: '링크', description: '하이퍼링크 삽입' },
    divider: { title: '구분선', description: '수평선 삽입' },
    code: { title: '코드', description: '코드 블록 삽입' },
    plugin: { title: '플러그인', description: '플러그인 텍스트 삽입' },
  };

  return tooltips[format] || { title: format, description: '' };
};

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
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipInfo = getToolTipInfo(format);
  const localButtonRef = useRef<HTMLButtonElement>(null);
  const actualButtonRef = buttonRef || localButtonRef;

  const updateTooltipPosition = () => {
    if (actualButtonRef && 'current' in actualButtonRef && actualButtonRef.current) {
      const rect = actualButtonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8, // 버튼 아래 8px
        left: rect.left + rect.width / 2, // 버튼 중앙
      });
    }
  };

  const handleMouseEnter = () => {
    updateTooltipPosition();
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowTooltip(false); // 클릭 시 툴팁 숨기기
    onClick();
  };

  // 스크롤 시 툴팁 위치 업데이트
  useEffect(() => {
    if (showTooltip) {
      const handleScroll = () => updateTooltipPosition();
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [showTooltip]);

  return (
    <>
      <button
        ref={actualButtonRef}
        type="button"
        onMouseDown={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`mx-1 rounded border border-black px-2 py-1 text-black transition-all duration-200 ${
          isActive ? 'bg-gray-200 shadow-inner' : 'bg-white hover:bg-gray-100 hover:shadow-md'
        }`}
        aria-label={format}
        style={style}
      >
        {icon}
      </button>

      {/* 툴팁 - fixed 위치로 동적 계산 */}
      {showTooltip && (
        <div
          className="fixed z-50 -translate-x-1/2 transform"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
          }}
        >
          <div className="rounded-lg bg-gray-800 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg">
            <div className="font-medium">{tooltipInfo.title}</div>
            {tooltipInfo.description && <div className="mt-1 text-xs text-gray-300">{tooltipInfo.description}</div>}
            {/* 위쪽 화살표 */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-b-gray-800"></div>
          </div>
        </div>
      )}
    </>
  );
};

interface LinkFormProps {
  onSubmit: (text: string, url: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const LinkForm = ({ onSubmit, onClose, position }: LinkFormProps) => {
  const [text, setText] = useState<string>('');
  const [url, setUrl] = useState<string>('');
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
      className="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">텍스트</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="링크에 표시될 텍스트"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="https://example.com"
          />
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
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
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
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
    previewStyle: 'border-t-2 border-black',
  },
  {
    id: 'dashed',
    name: '점선',
    style: 'border-t border-dashed border-black my-4',
    previewStyle: 'border-t-2 border-dashed border-black',
  },
  {
    id: 'dotted',
    name: '점선 (둥근점)',
    style: 'border-t border-dotted border-black my-4',
    previewStyle: 'border-t-2 border-dotted border-black',
  },
  {
    id: 'double',
    name: '이중선',
    style: 'border-t-4 border-double border-black my-4 h-3',
    previewStyle: 'border-t-4 border-double border-black',
  },
  {
    id: 'thick',
    name: '두꺼운 실선',
    style: 'border-t-2 border-black my-4',
    previewStyle: 'border-t-4 border-black',
  },
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
      className="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">구분선 스타일 선택</h3>
        <div className="space-y-2">
          {hrStyles.map((style) => (
            <button key={style.id} onClick={() => onSubmit(style.style)} className="flex w-full items-center rounded-md p-2 text-left hover:bg-gray-50">
              <div className={`mx-2 h-0.5 flex-1 ${style.previewStyle}`} />
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
  const [customColor, setCustomColor] = useState<string>('#000000');

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
      className="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <div className="grid grid-cols-3 gap-2">
          {colorList.map((color, index) => (
            <button key={index} onClick={() => onSubmit(color.value)} className="flex items-center justify-center rounded p-2 hover:bg-gray-50">
              <div className={`h-6 w-6 rounded ${color.preview}`} />
              <span className="ml-2 text-sm text-gray-600">{color.label}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3">
          <label className="mb-2 block text-sm font-medium text-gray-700">사용자 정의 색상</label>
          <div className="flex items-center gap-2">
            <input type="color" value={customColor || '#000000'} onChange={(e) => setCustomColor(e.target.value)} className="h-8 w-8 rounded border border-gray-300 p-0" />
            <input
              type="text"
              value={customColor || ''}
              onChange={(e) => setCustomColor(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              placeholder="#000000"
            />
            <button onClick={() => onSubmit(customColor)} className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
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
    preview: '• 항목 1\n• 항목 2\n• 항목 3',
  },
  {
    id: 'number',
    name: '번호 매기기',
    type: 'number' as const,
    icon: 'bi-list-ol',
    preview: '1. 항목 1\n2. 항목 2\n3. 항목 3',
  },
  {
    id: 'checkbox',
    name: '체크박스 목록',
    type: 'checkbox' as const,
    icon: 'bi-check-square',
    preview: '☐ 할 일 1\n☐ 할 일 2\n☐ 할 일 3',
  },
  {
    id: 'dash',
    name: '대시 목록',
    type: 'dash' as const,
    icon: 'bi-dash',
    preview: '- 항목 1\n- 항목 2\n- 항목 3',
  },
  {
    id: 'arrow',
    name: '화살표 목록',
    type: 'arrow' as const,
    icon: 'bi-arrow-right',
    preview: '→ 항목 1\n→ 항목 2\n→ 항목 3',
  },
  {
    id: 'roman',
    name: '로마 숫자',
    type: 'roman' as const,
    icon: 'bi-list-nested',
    preview: 'i. 항목 1\nii. 항목 2\niii. 항목 3',
  },
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
      className="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-2">
        <h3 className="px-1 text-sm font-medium text-gray-700">리스트 타입 선택</h3>
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {listTypes.map((listType) => (
            <button
              key={listType.id}
              onClick={() => onSubmit(listType.type)}
              className="flex w-full items-center rounded-md border border-gray-100 p-2 text-left transition-colors hover:bg-gray-50"
            >
              <i className={`bi ${listType.icon} mr-2 flex-shrink-0 text-base`}></i>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium">{listType.name}</div>
                <div className="mt-0.5 text-xs leading-tight whitespace-pre-line text-gray-500">{listType.preview}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ImageFormProps {
  onSubmit: (src: string, alt: string, mediaId?: number) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
  blogId?: number;
}

const ImageForm = ({ onSubmit, onClose, position, blogId }: ImageFormProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [altText, setAltText] = useState<string>('');
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [mediaId, setMediaId] = useState<number | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string>('');
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
    setMediaId(undefined);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    // file input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadType, previewUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 클라이언트 사이드 파일 크기 검증 (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('파일 크기가 10MB를 초과했습니다. 더 작은 파일을 선택해주세요.');
        // 파일 입력 초기화
        if (event.target) {
          event.target.value = '';
        }
        return;
      }

      // 즉시 미리보기를 위한 Object URL 생성
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // 서버에 파일 업로드
      try {
        const fileName = file.name.split('.')[0] || '';

        const result = await uploadImageToServer(file, fileName, undefined, blogId);

        if (result.success && result.url) {
          setImageUrl(result.url);
          setAltText(result.altText || fileName);
          setMediaId(result.mediaId);
          // 업로드 성공 후 Object URL 해제
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl('');
        } else {
          alert(`파일 업로드 실패: ${result.message || '알 수 없는 오류가 발생했습니다.'}`);
          // 업로드 실패 시에도 Object URL 해제
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl('');
        }
      } catch (error) {
        alert('파일 업로드 중 오류가 발생했습니다.');
        // 오류 발생 시에도 Object URL 해제
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl('');
      }
    }
  };

  const handleSubmit = () => {
    if (imageUrl) {
      onSubmit(imageUrl, altText || '이미지', mediaId);
      setImageUrl('');
      setAltText('');
      setMediaId(undefined);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
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
      className="fixed z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">이미지 추가</h3>

        {/* 디버그 정보 */}
        <div className="rounded bg-gray-50 p-2 text-xs text-gray-400">
          디버그: URL={imageUrl ? '있음' : '없음'}, 미리보기={previewUrl ? '있음' : '없음'}, 타입={uploadType}
        </div>

        {/* 업로드 타입 선택 */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setUploadType('url');
            }}
            className={`rounded px-3 py-1.5 text-sm ${uploadType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            URL
          </button>
          <button
            onClick={() => {
              setUploadType('file');
            }}
            className={`rounded px-3 py-1.5 text-sm ${uploadType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            파일 업로드
          </button>
        </div>

        {uploadType === 'url' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">이미지 URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                const url = e.target.value;
                setImageUrl(url);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">파일 선택</label>
            <input
              key={uploadType}
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">대체 텍스트</label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="이미지 설명"
          />
        </div>

        {/* 이미지 미리보기 */}
        {(imageUrl || previewUrl) && (
          <div className="mt-3">
            <p className="mb-2 text-sm text-gray-600">미리보기:</p>
            <div className="relative">
              <div className="relative h-24 w-full overflow-hidden rounded border">
                {previewUrl ? (
                  // 파일 업로드 중일 때는 Object URL 사용
                  <img src={previewUrl} alt={altText || '미리보기'} className="h-full w-full object-cover" />
                ) : (
                  // 서버 업로드 완료 후 이미지 표시
                  <img src={imageUrl} alt={altText || '미리보기'} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="mt-1 text-xs break-all text-gray-500">
                URL: {previewUrl || imageUrl}
                {previewUrl && <span className="ml-2 text-orange-500">(업로드 중...)</span>}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!imageUrl}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

const mediaOptions = [
  {
    id: 'image',
    name: '사진',
    type: 'image' as const,
    icon: 'bi-image',
    description: 'JPG, PNG, GIF 등의 이미지 파일',
  },
  {
    id: 'file',
    name: '파일',
    type: 'file' as const,
    icon: 'bi-file-earmark',
    description: 'PDF, DOC, TXT 등의 일반 파일',
  },
  {
    id: 'video',
    name: '영상',
    type: 'video' as const,
    icon: 'bi-camera-video',
    description: 'MP4, AVI, MOV 등의 동영상 파일',
  },
];

// 미디어 선택 드롭다운 개선
interface MediaDropdownProps {
  onSelect: (type: 'image' | 'file' | 'video') => void;
  onExistingSelect: (type: 'image' | 'file' | 'video') => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
}

const MediaDropdown = ({ onSelect, onExistingSelect, onClose, position }: MediaDropdownProps) => {
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
      className="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-2">
        <h3 className="px-2 py-1 text-sm font-medium text-gray-700">미디어 삽입</h3>

        {/* 새 파일 업로드 섹션 */}
        <div className="border-b border-gray-100 pb-2">
          <h4 className="mb-1 px-2 text-xs font-medium text-gray-600">새 파일 업로드</h4>
          {mediaOptions.map((option) => (
            <button
              key={`new-${option.id}`}
              onClick={() => onSelect(option.type)}
              className="flex w-full items-center rounded-md border border-gray-100 p-2 text-left transition-colors hover:bg-blue-50"
            >
              <i className={`bi ${option.icon} mr-3 flex-shrink-0 text-base text-blue-600`}></i>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{option.name} 업로드</div>
                <div className="mt-0.5 text-xs text-gray-500">{option.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* 기존 파일 선택 섹션 */}
        <div>
          <h4 className="mb-1 px-2 text-xs font-medium text-gray-600">기존 파일 선택</h4>
          {mediaOptions.map((option) => (
            <button
              key={`existing-${option.id}`}
              onClick={() => onExistingSelect(option.type)}
              className="flex w-full items-center rounded-md border border-gray-100 p-2 text-left transition-colors hover:bg-green-50"
            >
              <i className={`bi ${option.icon} mr-3 flex-shrink-0 text-base text-green-600`}></i>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">기존 {option.name} 선택</div>
                <div className="mt-0.5 text-xs text-gray-500">업로드된 {option.name} 목록에서 선택</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// 기존 미디어 파일 선택 모달 컴포넌트
interface ExistingMediaModalProps {
  onSubmit: (files: MediaFile[]) => void;
  onClose: () => void;
  isOpen: boolean;
  fileType: 'image' | 'file' | 'video';
  blogId?: number;
}

const ExistingMediaModal = ({ onSubmit, onClose, isOpen, fileType, blogId }: ExistingMediaModalProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadMediaFiles = async () => {
      if (!blogId) {
        setError('블로그 ID를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getMediaFiles({
          blogId: blogId,
          page: 0,
          size: 100, // 모달이므로 더 많은 파일 로드
          fileType: fileType,
        });
        setMediaFiles(response.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : '파일 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadMediaFiles();
      setSelectedFiles(new Set()); // 모달 열릴 때 선택 초기화
    }
  }, [isOpen, fileType, blogId]);

  const handleFileToggle = (fileId: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      // 비디오 타입인 경우 하나만 선택 가능
      if (fileType === 'video') {
        newSelected.clear();
      }
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    // 비디오 타입인 경우 전체 선택 비활성화
    if (fileType === 'video') return;

    if (selectedFiles.size === mediaFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(mediaFiles.map((file) => file.id)));
    }
  };

  const handleSubmit = () => {
    // 중복 클릭 방지
    if (isSubmitting || selectedFiles.size === 0) return;

    setIsSubmitting(true);

    try {
      const selectedMediaFiles = mediaFiles.filter((file) => selectedFiles.has(file.id));
      onSubmit(selectedMediaFiles);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'image':
        return '이미지';
      case 'video':
        return '동영상';
      case 'file':
        return '파일';
      default:
        return '파일';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 모달 컨텐츠 */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800">기존 {getFileTypeLabel()} 선택</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">파일 목록 로딩 중...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : mediaFiles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-500">업로드된 {getFileTypeLabel()}이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 전체 선택 버튼 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  {fileType !== 'video' && (
                    <button onClick={handleSelectAll} className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                      <input type="checkbox" checked={selectedFiles.size === mediaFiles.length && mediaFiles.length > 0} onChange={handleSelectAll} className="mr-2" />
                      전체 선택
                    </button>
                  )}
                  {fileType === 'video' && <div className="text-sm text-gray-500">비디오는 하나씩만 선택 가능합니다</div>}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedFiles.size}개 선택됨 / 총 {mediaFiles.length}개
                </div>
              </div>

              {/* 파일 그리드 */}
              <div
                className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto pr-2 md:grid-cols-3 lg:grid-cols-4"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db #f3f4f6',
                }}
              >
                {mediaFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleFileToggle(file.id)}
                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all ${
                      selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* 체크박스 */}
                    <div className="absolute top-2 right-2 z-10">
                      <input type="checkbox" checked={selectedFiles.has(file.id)} onChange={() => handleFileToggle(file.id)} className="h-4 w-4" />
                    </div>

                    {/* 파일 미리보기 */}
                    <div className="mb-2">
                      {fileType === 'image' ? (
                        <img
                          src={file.fileUrl}
                          alt={file.altText || file.originalFileName}
                          className="h-24 w-full rounded object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjwvcG=';
                          }}
                        />
                      ) : (
                        <div className="flex h-24 w-full items-center justify-center rounded bg-gray-100">
                          <i className={`bi ${fileType === 'video' ? 'bi-camera-video' : 'bi-file-earmark'} text-2xl text-gray-500`}></i>
                        </div>
                      )}
                    </div>

                    {/* 파일 정보 */}
                    <div className="text-xs">
                      <div className="truncate font-medium" title={file.originalFileName}>
                        {file.originalFileName}
                      </div>
                      <div className="mt-1 text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</div>
                      <div className="text-gray-500">{Math.round(file.fileSize / 1024)} KB</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 푸터 */}
        {!loading && !error && mediaFiles.length > 0 && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
            <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-100">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={selectedFiles.size === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              선택한 파일 삽입 ({selectedFiles.size}개)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface FileFormProps {
  onSubmit: (fileUrl: string, fileName: string, fileSize: number, fileType: string) => void;
  onClose: () => void;
  position: { top: number; left: number } | null;
  blogId?: number;
}

const FileForm = ({ onSubmit, onClose, position, blogId }: FileFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
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
      // 클라이언트 사이드 파일 크기 검증 (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('파일 크기가 50MB를 초과했습니다. 더 작은 파일을 선택해주세요.');
        // 파일 입력 초기화
        if (event.target) {
          event.target.value = '';
        }
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async () => {
    if (selectedFile) {
      try {
        const result = await uploadFileToServer(selectedFile, fileName || selectedFile.name, undefined, blogId);

        if (result.success && result.url) {
          // 파일 노드에 필요한 정보를 전달
          onSubmit(result.url, fileName || selectedFile.name, selectedFile.size, result.fileType || '');
          setSelectedFile(null);
          setFileName('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } else {
          alert(`파일 업로드 실패: ${result.message || '알 수 없는 오류가 발생했습니다.'}`);
        }
      } catch (error) {
        alert('파일 업로드 중 오류가 발생했습니다.');
      }
    }
  };

  if (!position) return null;

  return (
    <div
      ref={formRef}
      className="fixed z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">파일 업로드</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">파일 선택</label>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            accept=".pdf,.doc,.docx,.txt,.zip,.rar"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">표시 이름</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="파일 이름"
          />
        </div>

        {selectedFile && (
          <div className="mt-3 rounded bg-gray-50 p-2">
            <p className="text-sm text-gray-600">선택된 파일:</p>
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
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
  blogId?: number;
}

const VideoForm = ({ onSubmit, onClose, position, blogId }: VideoFormProps) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [altText, setAltText] = useState<string>('');
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
    // uploadType 변경 시 초기화
    if (uploadType === 'url') {
      setVideoUrl('');
      setAltText('');
      setSelectedVideo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setVideoUrl('');
      setAltText('');
      setSelectedVideo(null);
    }
  }, [uploadType]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 클라이언트 사이드 파일 크기 검증 (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('파일 크기가 50MB를 초과했습니다. 더 작은 파일을 선택해주세요.');
        // 파일 입력 초기화
        if (event.target) {
          event.target.value = '';
        }
        return;
      }

      // 서버에 파일 업로드
      try {
        const fileName = file.name.split('.')[0] || '';
        const result = await uploadVideoToServer(file, fileName, undefined, blogId);

        if (result.success && result.url) {
          setVideoUrl(result.url || '');
          setAltText(result.altText || fileName || '비디오');
          setSelectedVideo(file);
        } else {
          alert(`파일 업로드 실패: ${result.message || '알 수 없는 오류가 발생했습니다.'}`);
          // 업로드 실패 시에도 초기값 유지
          setVideoUrl('');
          setAltText('');
          setSelectedVideo(null);
        }
      } catch (error) {
        alert('비디오 업로드 중 오류가 발생했습니다.');
        // 에러 발생 시에도 초기값 유지
        setVideoUrl('');
        setAltText('');
        setSelectedVideo(null);
      }
    }
  };

  const handleSubmit = () => {
    if (videoUrl && videoUrl.trim()) {
      onSubmit(videoUrl, altText || '비디오');
      // 제출 후 초기화
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
      className="fixed z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left - 100}px`,
      }}
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">비디오 추가</h3>

        <div className="flex space-x-2">
          <button
            onClick={() => setUploadType('url')}
            className={`rounded px-3 py-1.5 text-sm ${uploadType === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            URL
          </button>
          <button
            onClick={() => setUploadType('file')}
            className={`rounded px-3 py-1.5 text-sm ${uploadType === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            파일 업로드
          </button>
        </div>

        {uploadType === 'url' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비디오 URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="https://example.com/video.mp4"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">파일 선택</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">설명</label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="비디오 설명"
          />
        </div>

        {selectedVideo && uploadType === 'file' && (
          <div className="mt-3 rounded bg-gray-50 p-2">
            <p className="text-sm text-gray-600">선택된 파일:</p>
            <p className="text-sm font-medium">{selectedVideo.name}</p>
            <p className="text-xs text-gray-500">{(selectedVideo.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100">
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!videoUrl}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

interface EditHeaderProps {
  blogId?: number;
}

export default function EditHeader({ blogId: propBlogId }: EditHeaderProps) {
  const [editor] = useLexicalComposerContext();
  
  // blogStore에서 실제 blogId 가져오기
  const storeBlogId = useBlogStore((state) => state.blogId);
  const blogId = storeBlogId || propBlogId || 0; // store > props > fallback
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
  const [isExistingMediaModalOpen, setIsExistingMediaModalOpen] = useState(false);
  const [existingMediaFileType, setExistingMediaFileType] = useState<'image' | 'file' | 'video'>('image');
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
        const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

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
      });
    });
  }, [editor]);

  const handleFormat = (format: string) => {
    if (format === 'underline' && activeStyles.has('strikethrough')) {
      // underline 선택 시 strikethrough 제거
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
    } else if (format === 'strikethrough' && activeStyles.has('underline')) {
      // strikethrough 선택 시 underline 제거
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
    }

    // 선택한 포맷 적용
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as TextFormatType);
  };

  const handleAlignment = (alignment: ElementFormatType) => {
    // 먼저 이미지 정렬을 시도
    const imageAlignmentHandled = editor.dispatchCommand(SET_IMAGE_ALIGNMENT_COMMAND, alignment);

    // 이미지 정렬이 처리되지 않았다면 일반 텍스트 정렬 적용
    if (!imageAlignmentHandled) {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    }
  };

  const handleTextSize = (size: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 텍스트가 선택되어 있는지 확인 (드래그된 상태)
      if (!selection.isCollapsed()) {
        // 선택된 텍스트에만 인라인 스타일 적용
        let fontSize = '';
        let lineHeight = '';
        let fontWeight = '';

        if (size === 'h1') {
          fontSize = '2.25rem';
          lineHeight = '1.2';
          fontWeight = 'bold';
        } else if (size === 'h2') {
          fontSize = '1.875rem';
          lineHeight = '1.2';
          fontWeight = 'bold';
        } else if (size === 'h3') {
          fontSize = '1.5rem';
          lineHeight = '1.2';
          fontWeight = 'bold';
        } else if (size === 'p1') {
          fontSize = '1.25rem';
          lineHeight = '1.75rem';
          fontWeight = 'normal';
        } else if (size === 'p2') {
          fontSize = '1.125rem';
          lineHeight = '1.75rem';
          fontWeight = 'normal';
        } else {
          // p3
          fontSize = '1rem';
          lineHeight = '1.5rem';
          fontWeight = 'normal';
        }

        // 선택된 텍스트에 인라인 스타일 적용
        $patchStyleText(selection, {
          'font-size': fontSize,
          'line-height': lineHeight,
          'font-weight': fontWeight,
        });
      } else {
        // 커서만 있는 경우 (텍스트 선택되지 않음) - 블록 단위로 변경
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
            } else {
              // p3
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
                const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();

                const domElement = editor.getElementByKey(element.getKey());
                if (domElement && element.getType() === 'paragraph') {
                  domElement.setAttribute('data-text-size', size);
                }
              }
            });
          }, 10);
        }
      }
    });
    setCurrentTextSize(size);
  };

  const handleList = () => {
    if (listButtonRef.current) {
      const rect = listButtonRef.current.getBoundingClientRect();
      setListFormPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleListSubmit = (type: 'bullet' | 'number' | 'checkbox' | 'dash' | 'arrow' | 'roman') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const anchorNode = selection.anchor.getNode();

      // 현재 노드가 리스트 아이템 안에 있는지 확인
      let currentListItemNode = null;
      let currentNode = anchorNode;

      while (currentNode) {
        if ($isListItemNode(currentNode)) {
          currentListItemNode = currentNode;
          break;
        }
        const parent = currentNode.getParent();
        if (!parent) break;
        currentNode = parent;
      }

      if (currentListItemNode) {
        // 현재 리스트 아이템 안에 있는 경우
        const currentList = currentListItemNode.getParent();
        if (!$isListNode(currentList)) return;

        const currentListType = currentList.getListType();

        // 리스트 타입 변경 또는 들여쓰기
        const prevSibling = currentListItemNode.getPreviousSibling();

        if (prevSibling && $isListItemNode(prevSibling)) {
          // 이전 형제가 있는 경우: 들여쓰기하면서 타입 변경
          if (type === 'bullet' || type === 'number') {
            // 기본 리스트 타입으로 들여쓰기
            const nestedList = $createListNode(type);
            const newListItem = $createListItemNode();
            newListItem.append(...currentListItemNode.getChildren());
            nestedList.append(newListItem);
            prevSibling.append(nestedList);

            // 현재 리스트 아이템 제거
            currentListItemNode.remove();

            // 새로운 리스트 아이템으로 포커스 이동
            newListItem.select();
          } else {
            // 커스텀 타입으로 들여쓰기
            const nestedList = $createListNode('bullet');
            const newListItem = $createListItemNode();
            newListItem.append(...currentListItemNode.getChildren());
            nestedList.append(newListItem);
            prevSibling.append(nestedList);
            currentListItemNode.remove();

            // 새로운 리스트 아이템으로 포커스 이동
            newListItem.select();

            // 커스텀 타입 설정
            setTimeout(() => {
              const domElement = editor.getElementByKey(nestedList.getKey());
              if (domElement) {
                domElement.setAttribute('data-list-type', type);
              }
            }, 0);
          }
        } else {
          // 이전 형제가 없는 경우: 현재 위치에서 타입만 변경
          if (type === 'bullet' || type === 'number') {
            // 기본 리스트 타입으로 변경
            if (currentListType !== type) {
              // 새로운 타입의 리스트 생성
              const newList = $createListNode(type);
              const newListItem = $createListItemNode();
              newListItem.append(...currentListItemNode.getChildren());
              newList.append(newListItem);

              // 현재 리스트를 새로운 리스트로 교체
              currentList.replace(newList);

              // 새로운 리스트 아이템으로 포커스 이동
              newListItem.select();
            }
          } else {
            // 커스텀 타입으로 변경
            const newList = $createListNode('bullet');
            const newListItem = $createListItemNode();
            newListItem.append(...currentListItemNode.getChildren());
            newList.append(newListItem);

            // 현재 리스트를 새로운 리스트로 교체
            currentList.replace(newList);

            // 새로운 리스트 아이템으로 포커스 이동
            newListItem.select();

            // 커스텀 타입 설정
            setTimeout(() => {
              const domElement = editor.getElementByKey(newList.getKey());
              if (domElement) {
                domElement.setAttribute('data-list-type', type);
              }
            }, 0);
          }
        }
      } else {
        // 일반 텍스트를 리스트로 변환 (기존 로직 유지)
        const nodes = selection.getNodes();
        const firstNode = nodes[0];
        const firstNodeParent = firstNode.getParent();

        if ($isListNode(firstNodeParent)) {
          // 이미 리스트인 경우, 리스트를 제거하고 일반 텍스트로 변환
          const paragraphs = nodes.map((node) => {
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
      }
    });
    setListFormPosition(null);
  };

  const handleLink = () => {
    if (linkButtonRef.current) {
      const rect = linkButtonRef.current.getBoundingClientRect();
      setLinkFormPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleLinkSubmit = (text: string, url: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 현재 선택된 텍스트 제거
      if (!selection.isCollapsed()) {
        selection.removeText();
      }

      // 링크 노드 생성
      const linkNode = $createLinkNode(url);
      linkNode.setURL(url);
      linkNode.setTarget('_blank');
      linkNode.setRel('noopener noreferrer');

      // 텍스트 노드 생성 및 링크 노드에 추가
      const textNode = $createTextNode(text);
      linkNode.append(textNode);

      // 현재 selection 위치에 링크 노드 삽입
      selection.insertNodes([linkNode]);
    });

    // 링크 폼 닫기
    setLinkFormPosition(null);

    // 포커스 복원
    editor.focus();
  };

  const handleDivider = () => {
    if (hrButtonRef.current) {
      const rect = hrButtonRef.current.getBoundingClientRect();
      setHrFormPosition({
        top: rect.bottom,
        left: rect.left,
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
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleBgColor = () => {
    if (bgColorButtonRef.current) {
      const rect = bgColorButtonRef.current.getBoundingClientRect();
      setBgColorFormPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleTextColorSubmit = (color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (selection.isCollapsed()) {
          // 선택 영역이 없을 때 - 현재 selection의 스타일 설정
          selection.style = selection.style ? selection.style + `color: ${color};` : `color: ${color};`;
        } else {
          // 선택 영역이 있을 때 - 선택된 텍스트에만 적용
          $patchStyleText(selection, { color });
        }
      }
    });

    // 색상 명령 실행
    editor.dispatchCommand(SET_TEXT_COLOR_COMMAND, color);

    // 포커스 복원
    editor.focus();

    // 색상 선택 폼 닫기
    setTextColorFormPosition(null);
  };

  const handleBgColorSubmit = (color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (selection.isCollapsed()) {
          // 선택 영역이 없을 때 - 현재 selection의 스타일 설정
          selection.style = selection.style ? selection.style + `background-color: ${color};` : `background-color: ${color};`;
        } else {
          // 선택 영역이 있을 때 - 선택된 텍스트에만 적용
          $patchStyleText(selection, { 'background-color': color });
        }
      }
    });

    // 색상 명령 실행
    editor.dispatchCommand(SET_BG_COLOR_COMMAND, color);

    // 포커스 복원
    editor.focus();

    // 색상 선택 폼 닫기
    setBgColorFormPosition(null);
  };

  const handleFontFamily = (fontValue: string) => {
    const fontOption = fontFamilyOptions.find((option) => option.value === fontValue);
    if (!fontOption) return;

    // 글꼴 선택 상태 업데이트
    setCurrentFontFamily(fontValue);

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const root = $getRoot();
      const firstChild = root.getFirstChild();

      // 빈 에디터인 경우
      if ($isParagraphNode(firstChild) && firstChild.getTextContent() === '') {
        // 기존 paragraph를 새로운 것으로 교체
        const newParagraph = $createParagraphNode();
        const textNode = $createTextNode('');
        if (fontValue !== 'default') {
          textNode.setStyle(`font-family: ${fontOption.family};`);
        }
        newParagraph.append(textNode);
        firstChild.replace(newParagraph);
        textNode.select();
      } else {
        // 일반적인 경우
        if (selection.isCollapsed()) {
          if (fontValue === 'default') {
            selection.style = selection.style ? selection.style.replace(/font-family:[^;]*;?/g, '') : '';
          } else {
            const currentStyle = selection.style || '';
            const newStyle = currentStyle.replace(/font-family:[^;]*;?/g, '') + `font-family: ${fontOption.family};`;
            selection.style = newStyle;
          }
        } else {
          if (fontValue === 'default') {
            $patchStyleText(selection, { 'font-family': null });
          } else {
            $patchStyleText(selection, { 'font-family': fontOption.family });
          }
        }
      }
    });

    // 포커스 복원
    editor.focus();
  };

  const handleImage = () => {
    if (imageButtonRef.current) {
      const rect = imageButtonRef.current.getBoundingClientRect();
      setMediaDropdownPosition({
        top: rect.bottom,
        left: rect.left,
      });
    }
  };

  const handleMediaSelect = (type: 'image' | 'file' | 'video') => {
    setMediaDropdownPosition(null);

    if (imageButtonRef.current) {
      const rect = imageButtonRef.current.getBoundingClientRect();
      const position = {
        top: rect.bottom,
        left: rect.left,
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

  const handleImageSubmit = (src: string, alt: string, mediaId?: number) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 이미지 앞에 빈 paragraph 추가
      const beforeParagraph = $createParagraphNode();
      beforeParagraph.append($createTextNode(''));

      // 실제 이미지 노드 생성 (mediaId 포함)
      const imageNode = $createCustomImageNode(src, alt, 'auto', 'auto', mediaId);

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

  const handleFileSubmit = (fileUrl: string, fileName: string, fileSize: number, fileType: string) => {
    // 에디터 업데이트 내부에서 노드 생성
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      // 파일 노드 생성 (fileName, fileSize, fileType, fileUrl)
      const fileNode = $createCustomFileNode(fileName, fileSize, fileType, fileUrl);

      // 파일 앞뒤에 빈 paragraph 추가
      const beforeParagraph = $createParagraphNode();
      beforeParagraph.append($createTextNode(''));

      const afterParagraph = $createParagraphNode();
      afterParagraph.append($createTextNode(''));

      selection.insertNodes([beforeParagraph, fileNode, afterParagraph]);
      afterParagraph.selectEnd();
    });
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

  const handleExistingMediaSelect = (type: 'image' | 'file' | 'video') => {
    setMediaDropdownPosition(null);
    setExistingMediaFileType(type);
    setIsExistingMediaModalOpen(true);
  };

  const handleExistingMediaSubmit = (files: MediaFile[]) => {
    // 빈 파일 배열이거나 이미 처리 중인 경우 방지
    if (!files || files.length === 0) return;

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        for (const file of files) {
          if (file.fileType === 'image') {
            // 이미지 노드 생성 및 삽입 (handleImageSubmit과 동일한 방식)
            const beforeParagraph = $createParagraphNode();
            beforeParagraph.append($createTextNode(''));

            const imageNode = $createCustomImageNode(file.fileUrl, file.altText || file.originalFileName, 'auto', 'auto', file.id);

            const afterParagraph = $createParagraphNode();
            afterParagraph.append($createTextNode(''));

            selection.insertNodes([beforeParagraph, imageNode, afterParagraph]);
            afterParagraph.selectEnd();
          } else if (file.fileType === 'video') {
            // 비디오 노드 생성 및 삽입 (handleVideoSubmit과 동일한 방식)
            const beforeParagraph = $createParagraphNode();
            beforeParagraph.append($createTextNode(''));

            const videoNode = $createCustomVideoNode(file.fileUrl, file.altText || file.originalFileName);

            const afterParagraph = $createParagraphNode();
            afterParagraph.append($createTextNode(''));

            selection.insertNodes([beforeParagraph, videoNode, afterParagraph]);
            afterParagraph.selectEnd();
          } else {
            // 파일 노드 생성 및 삽입 (handleFileSubmit과 동일한 방식)
            const beforeParagraph = $createParagraphNode();
            beforeParagraph.append($createTextNode(''));

            const fileNode = $createCustomFileNode(file.originalFileName, file.fileSize, file.mimeType, file.fileUrl);

            const afterParagraph = $createParagraphNode();
            afterParagraph.append($createTextNode(''));

            selection.insertNodes([beforeParagraph, fileNode, afterParagraph]);
            afterParagraph.selectEnd();
          }
        }
      }
    });
    setIsExistingMediaModalOpen(false);
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
    <div className="sticky top-0 z-50 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center">
        <div className="flex items-center space-x-3">
          <Link href="/" className="text-black hover:text-gray-600">
            <i className="bi bi-arrow-left text-xl"></i>
          </Link>
          <span className="px-4 py-2 text-lg font-semibold">글쓰기</span>
        </div>

        {/* 텍스트 크기 선택 드롭다운 */}
        <div className="ml-8 flex items-center space-x-1">
          <ToolbarButton format="image" icon={<i className="bi bi-image"></i>} onClick={handleImage} isActive={false} buttonRef={imageButtonRef} />

          <div className="mx-2 h-6 border-l border-gray-300" />

          <div className="group relative mx-1">
            <select
              value={currentTextSize}
              onChange={(e) => handleTextSize(e.target.value)}
              className="h-8 rounded border border-black bg-white px-2 py-1 text-sm transition-all duration-200 hover:bg-gray-100 hover:shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              style={{
                fontSize: '1rem', // 선택된 값은 본문3 크기로 통일
                fontWeight: 'normal',
                lineHeight: '1.2',
                width: 'auto',
                minWidth: '100px',
              }}
            >
              {textSizeOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  style={{
                    fontSize:
                      option.value === 'h1'
                        ? '2.25rem'
                        : option.value === 'h2'
                          ? '1.875rem'
                          : option.value === 'h3'
                            ? '1.5rem'
                            : option.value === 'p1'
                              ? '1.25rem'
                              : option.value === 'p2'
                                ? '1.125rem'
                                : '1rem',
                    fontWeight: ['h1', 'h2', 'h3'].includes(option.value) ? 'bold' : 'normal',
                    lineHeight: '1.2',
                  }}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {/* 텍스트 크기 툴팁 - 호버 시만 표시, sticky 헤더와 함께 움직임 */}
            <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="rounded-lg bg-gray-800 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg">
                <div className="font-medium">텍스트 크기</div>
                <div className="mt-1 text-xs text-gray-300">제목과 본문 크기 선택</div>
                {/* 위쪽 화살표 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-b-gray-800"></div>
              </div>
            </div>
          </div>

          {/* 글씨체 선택 드롭다운 */}
          <div className="group relative mx-1">
            <select
              value={currentFontFamily}
              onChange={(e) => handleFontFamily(e.target.value)}
              className="h-8 rounded border border-black bg-white px-2 py-1 text-sm transition-all duration-200 hover:bg-gray-100 hover:shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              {fontFamilyOptions.map((option) => (
                <option key={option.value} value={option.value} style={{ fontFamily: option.family }}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* 글꼴 툴팁 - 아래쪽 표시 */}
            <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="rounded-lg bg-gray-800 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg">
                <div className="font-medium">글꼴</div>
                <div className="mt-1 text-xs text-gray-300">텍스트 글꼴 변경</div>
                {/* 위쪽 화살표 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-b-gray-800"></div>
              </div>
            </div>
          </div>

          <div className="mx-2 h-6 border-l border-gray-300" />

          <ToolbarButton format="bold" icon={<i className="bi bi-type-bold"></i>} onClick={() => handleFormat('bold')} isActive={activeStyles.has('bold')} />
          <ToolbarButton format="italic" icon={<i className="bi bi-type-italic"></i>} onClick={() => handleFormat('italic')} isActive={activeStyles.has('italic')} />
          <ToolbarButton format="underline" icon={<i className="bi bi-type-underline"></i>} onClick={() => handleFormat('underline')} isActive={activeStyles.has('underline')} />
          <ToolbarButton
            format="strikethrough"
            icon={<i className="bi bi-type-strikethrough"></i>}
            onClick={() => handleFormat('strikethrough')}
            isActive={activeStyles.has('strikethrough')}
          />
          <div className="mx-2 h-6 border-l border-gray-300" />
          <ToolbarButton format="textColor" icon={<i className="bi bi-pencil"></i>} onClick={handleTextColor} isActive={false} buttonRef={textColorButtonRef} />
          <ToolbarButton format="bgColor" icon={<i className="bi bi-paint-bucket"></i>} onClick={handleBgColor} isActive={false} buttonRef={bgColorButtonRef} />
          <div className="mx-2 h-6 border-l border-gray-300" />
          <ToolbarButton format="left" icon={<i className="bi bi-text-left"></i>} onClick={() => handleAlignment('left')} isActive={false} />
          <ToolbarButton format="center" icon={<i className="bi bi-text-center"></i>} onClick={() => handleAlignment('center')} isActive={false} />
          <ToolbarButton format="right" icon={<i className="bi bi-text-right"></i>} onClick={() => handleAlignment('right')} isActive={false} />
          <ToolbarButton format="justify" icon={<i className="bi bi-justify"></i>} onClick={() => handleAlignment('justify')} isActive={false} />
          <div className="mx-2 h-6 border-l border-gray-300" />
          <ToolbarButton format="list" icon={<i className="bi bi-list-ul"></i>} onClick={handleList} isActive={false} buttonRef={listButtonRef} />
          <ToolbarButton format="link" icon={<i className="bi bi-link-45deg"></i>} onClick={handleLink} isActive={false} buttonRef={linkButtonRef} />
          <ToolbarButton format="divider" icon={<i className="bi bi-hr"></i>} onClick={handleDivider} isActive={false} buttonRef={hrButtonRef} />
          <ToolbarButton format="code" icon={<i className="bi bi-code"></i>} onClick={handleCode} isActive={false} />
          <ToolbarButton format="plugin" icon={<i className="bi bi-plugin"></i>} onClick={handlePlugin} isActive={false} />
        </div>
      </div>

      {linkFormPosition && <LinkForm onSubmit={handleLinkSubmit} onClose={() => setLinkFormPosition(null)} position={linkFormPosition} />}
      {hrFormPosition && <HrForm onSubmit={handleHrSubmit} onClose={() => setHrFormPosition(null)} position={hrFormPosition} />}
      {listFormPosition && <ListForm onSubmit={handleListSubmit} onClose={() => setListFormPosition(null)} position={listFormPosition} />}
      {textColorFormPosition && <ColorForm onSubmit={handleTextColorSubmit} onClose={() => setTextColorFormPosition(null)} position={textColorFormPosition} title="텍스트 색상" />}
      {bgColorFormPosition && <ColorForm onSubmit={handleBgColorSubmit} onClose={() => setBgColorFormPosition(null)} position={bgColorFormPosition} title="배경 색상" />}
      {imageFormPosition && <ImageForm onSubmit={handleImageSubmit} onClose={() => setImageFormPosition(null)} position={imageFormPosition} blogId={blogId} />}
      {mediaDropdownPosition && (
        <MediaDropdown onSelect={handleMediaSelect} onExistingSelect={handleExistingMediaSelect} onClose={() => setMediaDropdownPosition(null)} position={mediaDropdownPosition} />
      )}

      <ExistingMediaModal
        onSubmit={handleExistingMediaSubmit}
        onClose={() => setIsExistingMediaModalOpen(false)}
        isOpen={isExistingMediaModalOpen}
        fileType={existingMediaFileType}
        blogId={blogId}
      />
      {fileFormPosition && <FileForm onSubmit={handleFileSubmit} onClose={() => setFileFormPosition(null)} position={fileFormPosition} blogId={blogId} />}
      {videoFormPosition && <VideoForm onSubmit={handleVideoSubmit} onClose={() => setVideoFormPosition(null)} position={videoFormPosition} blogId={blogId} />}
    </div>
  );
}
