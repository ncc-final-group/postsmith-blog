import React from "react";
import { Editor, Element as SlateElement, Transforms } from "slate";
import { useSlate } from "slate-react";

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      n.type === format,
  });
  return !!match;
};

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

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === "numbered-list" || format === "bulleted-list";

  Transforms.unwrapNodes(editor, {
    match: n =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n.type === "numbered-list" || n.type === "bulleted-list"),
    split: true,
  });

  let newType: any = isActive ? "paragraph" : format;
  if (!isActive && isList) {
    newType = "list-item";
  }

  Transforms.setNodes(editor, { type: newType } as Partial<SlateElement>);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block as any);
  }
};

const EditorToolbar = () => {
  const editor = useSlate();
  return (
    <div className="flex items-center px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-20">
      <ToolbarButton format="bold" icon={<b>B</b>} onClick={() => toggleMark(editor, "bold")} />
      <ToolbarButton format="italic" icon={<i>I</i>} onClick={() => toggleMark(editor, "italic")} />
      <ToolbarButton format="underline" icon={<u>U</u>} onClick={() => toggleMark(editor, "underline")} />
      <ToolbarButton format="heading" icon="H1" onClick={() => toggleBlock(editor, "heading")} />
      <ToolbarButton format="numbered-list" icon="1." onClick={() => toggleBlock(editor, "numbered-list")} />
      <ToolbarButton format="bulleted-list" icon="•" onClick={() => toggleBlock(editor, "bulleted-list")} />
      <ToolbarButton format="block-quote" icon="❝" onClick={() => toggleBlock(editor, "block-quote")} />
      <ToolbarButton format="code" icon="</>" onClick={() => toggleBlock(editor, "code")} />
    </div>
  );
};

export default EditorToolbar; 