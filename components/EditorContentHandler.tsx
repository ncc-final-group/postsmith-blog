'use client';

import { useEffect } from 'react';

export default function EditorContentHandler() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 체크박스 리스트 아이템인지 확인
      const listItem = target.closest('li');
      if (!listItem) return;

      const list = listItem.closest('ul[data-list-type="checkbox"]');
      if (!list) return;

      // editor-content 내의 클릭인지 확인
      const editorContent = listItem.closest('.editor-content');
      if (!editorContent) return;

      e.preventDefault();

      // 체크 상태 토글
      const isChecked = listItem.hasAttribute('data-checked');

      if (isChecked) {
        listItem.removeAttribute('data-checked');
      } else {
        listItem.setAttribute('data-checked', 'true');
      }
    };

    // 링크 클릭 처리
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const closestLink = target.closest('a');

      if (closestLink) {
        // editor-content 내의 링크인지 확인
        const editorContent = closestLink.closest('.editor-content');
        if (editorContent) {
          e.preventDefault();
          window.open(closestLink.href, '_blank');
        }
      }
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('click', handleLinkClick);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  return null;
}
