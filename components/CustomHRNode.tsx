import { DecoratorNode, NodeKey } from 'lexical';
import React, { ReactNode } from 'react';

export class CustomHRNode extends DecoratorNode<ReactNode> {
  __style: string;

  static getType(): string {
    return 'custom-hr';
  }

  static clone(node: CustomHRNode): CustomHRNode {
    return new CustomHRNode(node.__style, node.__key);
  }

  constructor(style: string, key?: NodeKey) {
    super(key);
    this.__style = style;
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div');
    div.style.userSelect = 'none';
    div.style.cursor = 'pointer';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return <hr className={this.__style} />;
  }

  isIsolated(): boolean {
    return true;
  }

  canBeEmpty(): boolean {
    return false;
  }

  canInsertTextBefore(): boolean {
    return true;
  }

  canInsertTextAfter(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  canSelectBefore(): boolean {
    return true;
  }

  canSelectAfter(): boolean {
    return true;
  }
}

// Helper functions
export function $createCustomHRNode(style: string): CustomHRNode {
  return new CustomHRNode(style);
}

export function $isCustomHRNode(node: any): node is CustomHRNode {
  return node instanceof CustomHRNode;
}
