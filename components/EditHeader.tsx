import { ElementFormatType, FORMAT_ELEMENT_COMMAND, FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getSelection, $isRangeSelection } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createListNode, $isListNode, ListNode } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import "bootstrap-icons/font/bootstrap-icons.css";

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
    isLink: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    alignment: 'left',
    isLink: false,
  });

  const handleFormat = (
    command: typeof FORMAT_TEXT_COMMAND | typeof FORMAT_ELEMENT_COMMAND,
    format: TextFormatType | ElementFormatType
  ) => {
    editor.focus();
    editor.dispatchCommand(command, format);
    if (command === FORMAT_TEXT_COMMAND) {
      setActiveFormats(prev => ({
        ...prev,
        [format]: !prev[format as keyof typeof prev],
      }));
    } else if (command === FORMAT_ELEMENT_COMMAND) {
      setActiveFormats(prev => ({
        ...prev,
        alignment: format as ElementFormatType,
      }));
    }
  };

  const handleList = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (selection.anchor.getNode().getParent()?.__type === 'list') {
          // If already in a list, convert back to paragraph
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          // Convert to unordered list
          const listNode = $createListNode('bullet');
          $setBlocksType(selection, () => $createListNode('bullet'));
        }
      }
    });
  };

  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const handleDivider = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = selection.anchor.getNode();
        const hr = $createParagraphNode();
        hr.setStyle('border-bottom: 1px solid black');
        node.insertAfter(hr);
      }
    });
  };

  return (
    <header className="sticky top-0 z-10 min-h-[74px] w-full min-w-[1230px] border-b border-gray-200 bg-white px-4 py-1 shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center text-xl font-bold text-black">
            <Image src="/logo.png" alt="Logo" width={144} height={74} className="mr-2 inline-block" />
          </Link>
          <div className="ml-[100px] flex items-center">
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
            <div className="mx-2 h-6 w-px bg-gray-300" />
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
              isActive={activeFormats.isLink}
            />
            <ToolbarButton
              format="divider"
              icon={<i className="bi bi-hr"></i>}
              onClick={handleDivider}
              isActive={false}
            />
          </div>
        </div>
        <div className="flex items-center">
          <ToolbarButton
            format="left"
            icon={<i className="bi bi-justify-left"></i>}
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'left')}
            isActive={activeFormats.alignment === 'left'}
          />
          <ToolbarButton
            format="center"
            icon={<i className="bi bi-text-center"></i>}
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'center')}
            isActive={activeFormats.alignment === 'center'}
          />
          <ToolbarButton
            format="right"
            icon={<i className="bi bi-justify-right"></i>}
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'right')}
            isActive={activeFormats.alignment === 'right'}
          />
          <ToolbarButton
            format="justify"
            icon={<i className="bi bi-justify"></i>}
            onClick={() => handleFormat(FORMAT_ELEMENT_COMMAND, 'justify')}
            isActive={activeFormats.alignment === 'justify'}
          />
        </div>
      </div>
    </header>
  );
} 