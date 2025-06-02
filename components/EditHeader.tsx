import { ElementFormatType, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, TextFormatType, createCommand, $isTextNode, COMMAND_PRIORITY_LOW } from 'lexical';
import { TextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection, $createTextNode } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createListNode, $createListItemNode, $isListNode, ListNode } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $createLinkNode } from '@lexical/link';
import { $createCustomHRNode } from './CustomHRNode';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";
import React from 'react';
import { $getRoot } from 'lexical';
import { SET_TEXT_COLOR_COMMAND, SET_BG_COLOR_COMMAND } from './Editor';

// 커스텀 TextFormatType 타입 확장
type ExtendedTextFormatType = TextFormatType | string;

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
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="링크에 표시될 텍스트"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <input
            type="url"
            value={url}
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
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-8 h-8 p-0 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={customColor}
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

export default function EditHeader() {
  const [editor] = useLexicalComposerContext();
  const [activeStyles, setActiveStyles] = useState<Set<string>>(new Set());
  const [blockType, setBlockType] = useState<string>('paragraph');
  const [linkFormPosition, setLinkFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [hrFormPosition, setHrFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [textColorFormPosition, setTextColorFormPosition] = useState<{ top: number; left: number } | null>(null);
  const [bgColorFormPosition, setBgColorFormPosition] = useState<{ top: number; left: number } | null>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const hrButtonRef = useRef<HTMLButtonElement>(null);
  const textColorButtonRef = useRef<HTMLButtonElement>(null);
  const bgColorButtonRef = useRef<HTMLButtonElement>(null);

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
      });
    });
  }, [editor]);

  const handleFormat = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format as TextFormatType);
  };

  const handleAlignment = (alignment: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const handleList = () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const nodes = selection.getNodes();
    const firstNode = nodes[0];
    const firstNodeParent = firstNode.getParent();

    if ($isListNode(firstNodeParent)) {
      // 이미 리스트인 경우, 리스트를 제거하고 일반 텍스트로 변환
      editor.update(() => {
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
      });
    } else {
      // 일반 텍스트를 리스트로 변환
      editor.update(() => {
        const listNode = $createListNode('bullet');
        const listItemNode = $createListItemNode();
        listItemNode.append($createTextNode(firstNode.getTextContent()));
        listNode.append(listItemNode);
        firstNode.replace(listNode);
      });
    }
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

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-black hover:text-gray-600">
            <i className="bi bi-arrow-left text-xl"></i>
          </Link>
          <span className="text-lg font-semibold">글쓰기</span>
        </div>
      </div>
      <div className="flex items-center mt-2 space-x-1">
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
    </div>
  );
} 