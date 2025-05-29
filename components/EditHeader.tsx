import { ElementFormatType, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const ToolbarButton = ({
  format,
  icon,
  onClick,
  isActive,
}: {
  format: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive: boolean;
}) => (
  <button
    type="button"
    onMouseDown={e => {
      e.preventDefault();
      onClick();
    }}
    className={`px-2 py-1 border border-black rounded mx-1 hover:bg-gray-200 text-black ${
      isActive ? 'bg-gray-200' : 'bg-white'
    }`}
    aria-label={format}
  >
    {icon}
  </button>
);

export default function EditHeader() {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    alignment: ElementFormatType;
  }>({
    bold: false,
    italic: false,
    underline: false,
    alignment: 'left',
  });

  const handleFormat = (
    command: typeof FORMAT_TEXT_COMMAND | typeof FORMAT_ELEMENT_COMMAND,
    format: TextFormatType | ElementFormatType
  ) => {
    editor.focus();
    editor.dispatchCommand(command, format);
    // Update active state
    if (command === FORMAT_TEXT_COMMAND) {
      setActiveFormats(prev => {
        const newState = {
          ...prev,
          [format]: !prev[format as keyof typeof prev],
        };
        console.log('텍스트 서식 상태:', {
          bold: newState.bold ? '굵게' : '일반',
          italic: newState.italic ? '기울임' : '일반',
          underline: newState.underline ? '밑줄' : '일반',
          alignment:
            newState.alignment === 'left'
              ? '왼쪽'
              : newState.alignment === 'center'
              ? '가운데'
              : newState.alignment === 'right'
              ? '오른쪽'
              : '기본',
        });
        return newState;
      });
    } else if (command === FORMAT_ELEMENT_COMMAND) {
      setActiveFormats(prev => {
        const newState = {
          ...prev,
          alignment: format as ElementFormatType,
        };
        console.log('정렬 상태:', {
          bold: newState.bold ? '굵게' : '일반',
          italic: newState.italic ? '기울임' : '일반',
          underline: newState.underline ? '밑줄' : '일반',
          alignment:
            newState.alignment === 'left'
              ? '왼쪽'
              : newState.alignment === 'center'
              ? '가운데'
              : newState.alignment === 'right'
              ? '오른쪽'
              : '기본',
        });
        return newState;
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 min-h-[74px] w-full min-w-[1230px] border-b border-gray-200 bg-white px-4 py-1 shadow-sm">
      <div className="flex flex-shrink-0 items-center">
        <Link href="/" className="flex items-center text-xl font-bold text-black">
          <Image src="/logo.png" alt="Logo" width={144} height={74} className="mr-2 inline-block" />
        </Link>
        <div style={{ marginLeft: '100px' }} className="flex items-center">
          <ToolbarButton
            format="bold"
            icon={<b>B</b>}
            onClick={() => handleFormat(FORMAT_TEXT_COMMAND, 'bold')}
            isActive={activeFormats.bold}
          />
          <ToolbarButton
            format="italic"
            icon={<i>I</i>}
            onClick={() => handleFormat(FORMAT_TEXT_COMMAND, 'italic')}
            isActive={activeFormats.italic}
          />
          <ToolbarButton
            format="underline"
            icon={<u>U</u>}
            onClick={() => handleFormat(FORMAT_TEXT_COMMAND, 'underline')}
            isActive={activeFormats.underline}
          />
          <ToolbarButton
            format="paragraph"
            icon="P"
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'left')}
            isActive={activeFormats.alignment === 'left'}
          />
          <ToolbarButton
            format="block-quote"
            icon="❝"
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'center')}
            isActive={activeFormats.alignment === 'center'}
          />
          <ToolbarButton
            format="code"
            icon="</>"
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'right')}
            isActive={activeFormats.alignment === 'right'}
          />
        </div>
      </div>
    </header>
  );
} 