import React from "react";
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND, LexicalEditor } from "lexical";

const ToolbarButton = ({
  format,
  icon,
  onClick,
}: {
  format: string;
  icon: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    type="button"
    onMouseDown={e => {
      e.preventDefault();
      onClick();
    }}
    className="px-2 py-1 border border-black rounded mx-1 hover:bg-gray-200 text-black"
    aria-label={format}
  >
    {icon}
  </button>
);

const LexicalToolbar = ({ editor }: { editor: LexicalEditor }) => (
  <div className="flex items-center px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-20">
    <ToolbarButton format="bold" icon={<b>B</b>} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} />
    <ToolbarButton format="italic" icon={<i>I</i>} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} />
    <ToolbarButton format="underline" icon={<u>U</u>} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} />
    <ToolbarButton format="heading" icon="H1" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "heading")} />
    <ToolbarButton format="numbered-list" icon="1." onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "numbered")} />
    <ToolbarButton format="bulleted-list" icon="•" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "bulleted")} />
    <ToolbarButton format="block-quote" icon="❝" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "quote")} />
    <ToolbarButton format="code" icon="</>" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "code")} />
  </div>
);

export default LexicalToolbar; 