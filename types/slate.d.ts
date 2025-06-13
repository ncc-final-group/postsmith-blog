import { BaseElement } from 'slate';

type CustomText = { text: string };
type CustomElement = { type: 'paragraph'; children: CustomText[] };

declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement;
    Text: CustomText;
  }
}
