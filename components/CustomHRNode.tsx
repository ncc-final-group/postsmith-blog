import { DecoratorNode, NodeKey } from 'lexical';
import React, { ReactNode } from 'react';

export class CustomHRNode extends DecoratorNode<ReactNode> {
  __style: string;
  __color: string;

  static getType(): string {
    return 'custom-hr';
  }

  static clone(node: CustomHRNode): CustomHRNode {
    return new CustomHRNode(node.__style, node.__color, node.__key);
  }

  constructor(style: string, color: string = '#000000', key?: NodeKey) {
    super(key);
    this.__style = style;
    this.__color = color;
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
    // 스타일 ID에 따라 인라인 스타일 적용
    let inlineStyle: React.CSSProperties = {
      display: 'block',
      width: '100%',
      margin: '16px 0',
      border: 'none',
      height: '0px',
    };

    if (this.__style.includes('border-dashed')) {
      inlineStyle.borderTop = `2px dashed ${this.__color}`;
    } else if (this.__style.includes('border-dotted')) {
      inlineStyle.borderTop = `2px dotted ${this.__color}`;
    } else if (this.__style.includes('border-double')) {
      inlineStyle.borderTop = `4px double ${this.__color}`;
    } else if (this.__style.includes('border-t-4')) {
      inlineStyle.borderTop = `4px solid ${this.__color}`;
    } else {
      inlineStyle.borderTop = `2px solid ${this.__color}`;
    }

    return <hr className={this.__style} style={inlineStyle} />;
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
export function $createCustomHRNode(style: string, color: string = '#000000'): CustomHRNode {
  return new CustomHRNode(style, color);
}

export function $isCustomHRNode(node: any): node is CustomHRNode {
  return node instanceof CustomHRNode;
}
