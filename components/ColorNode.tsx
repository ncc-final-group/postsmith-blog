import { TextNode } from 'lexical';

export class ColorTextNode extends TextNode {
  __textColor: string;
  __bgColor: string;

  static getType(): string {
    return 'color-text';
  }

  static clone(node: ColorTextNode): ColorTextNode {
    return new ColorTextNode(node.__text, node.__textColor, node.__bgColor, node.__key);
  }

  constructor(text: string, textColor: string = 'text-black', bgColor: string = 'bg-transparent', key?: string) {
    super(text, false, key);
    this.__textColor = textColor;
    this.__bgColor = bgColor;
  }

  createDOM(config: any): HTMLElement {
    const element = super.createDOM(config);
    element.className = `${this.__textColor} ${this.__bgColor}`;
    return element;
  }

  updateDOM(prevNode: ColorTextNode, dom: HTMLElement): boolean {
    const isUpdated = super.updateDOM(prevNode, dom);
    if (prevNode.__textColor !== this.__textColor || prevNode.__bgColor !== this.__bgColor) {
      dom.className = `${this.__textColor} ${this.__bgColor}`;
      return true;
    }
    return isUpdated;
  }

  setTextColor(color: string): void {
    const self = this.getWritable();
    self.__textColor = color;
  }

  setBackgroundColor(color: string): void {
    const self = this.getWritable();
    self.__bgColor = color;
  }
}

export function $createColorTextNode(text: string, textColor?: string, bgColor?: string): ColorTextNode {
  return new ColorTextNode(text, textColor, bgColor);
}

export function $isColorTextNode(node: any): node is ColorTextNode {
  return node instanceof ColorTextNode;
} 