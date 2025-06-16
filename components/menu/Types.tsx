export interface MenuType {
  id: number;
  name: string;
  type: 'DEFAULT' | 'PAGE' | 'CATEGORY' | 'MANUAL';
  uri: string;
  isBlank: boolean;
  isDefault?: boolean;
}

export interface DragItem {
  id: number;
  index: number;  // 여기서 number 타입으로 명확히 지정
  type: string;   // 드래그 아이템의 타입 문자열 (예: 'MENU')
}