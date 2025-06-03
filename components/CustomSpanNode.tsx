'use client';

import {
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  $createTextNode,
  $isTextNode,
} from 'lexical';

export type SerializedSpanNode = SerializedElementNode;

export class SpanNode extends ElementNode {
  __color: string;
  __backgroundColor: string;

  static getType(): string {
    return 'span';
  }

  static clone(node: SpanNode): SpanNode {
    return new SpanNode(node.__color, node.__backgroundColor, node.__key);
  }

  constructor(color?: string, backgroundColor?: string, key?: NodeKey) {
    super(key);
    this.__color = color || '';
    this.__backgroundColor = backgroundColor || '';
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('span');
    if (this.__color) {
      dom.style.color = this.__color;
    }
    if (this.__backgroundColor) {
      dom.style.backgroundColor = this.__backgroundColor;
    }
    return dom;
  }

  updateDOM(prevNode: SpanNode, dom: HTMLElement): boolean {
    const shouldUpdate = 
      prevNode.__color !== this.__color || 
      prevNode.__backgroundColor !== this.__backgroundColor;

    if (shouldUpdate) {
      if (this.__color) {
        dom.style.color = this.__color;
      } else {
        dom.style.removeProperty('color');
      }
      if (this.__backgroundColor) {
        dom.style.backgroundColor = this.__backgroundColor;
      } else {
        dom.style.removeProperty('background-color');
      }
    }
    return shouldUpdate;
  }

  static importJSON(serializedNode: SerializedSpanNode): SpanNode {
    const node = $createSpanNode();
    return node;
  }

  exportJSON(): SerializedSpanNode {
    return {
      ...super.exportJSON(),
      type: 'span',
      version: 1,
    };
  }

  setColor(color: string): void {
    const self = this.getWritable();
    self.__color = color;
  }

  setBackgroundColor(color: string): void {
    const self = this.getWritable();
    self.__backgroundColor = color;
  }

  getColor(): string {
    return this.__color;
  }

  getBackgroundColor(): string {
    return this.__backgroundColor;
  }

  insertNewAfter(selection: any): null | LexicalNode {
    const element = this.getParentOrThrow().insertNewAfter(selection);
    if ($isTextNode(element)) {
      const spanNode = $createSpanNode(this.__color, this.__backgroundColor);
      element.replace(spanNode);
      return spanNode;
    }
    return null;
  }
}

export function $createSpanNode(color?: string, backgroundColor?: string): SpanNode {
  return new SpanNode(color, backgroundColor);
}

export function $isSpanNode(node: LexicalNode | null | undefined): node is SpanNode {
  return node instanceof SpanNode;
} 