'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface MenuItem {
  key: string;
  label: string;
  subItems: { label: string; route: string }[];
  route?: string;
}

const menuItems: MenuItem[] = [
  {
    key: 'write',
    label: '글쓰기',
    subItems: [
      { label: '글 관리', route: 'usermanage/posts' },
      { label: '페이지 관리', route: 'usermanage/pages' },
      { label: '카테고리 관리', route: 'usermanage/categories' },
      { label: '공지 관리', route: 'usermanage/notices' },
    ],
  },
  {
    key: 'comments',
    label: '댓글 방명록 관리',
    subItems: [
      { label: '댓글 관리', route: 'usermanage/comments' },
      { label: '방명록 관리', route: 'usermanage/guestbook' },
    ],
  },
  {
    key: 'stats',
    label: '통계',
    subItems: [{ label: '방문 통계', route: 'usermanage/stats/visits' }],
  },
  {
    key: 'customize',
    label: '꾸미기',
    subItems: [{ label: '스킨', route: 'usermanage/customize/skin' }],
  },
  {
    key: 'plugins',
    label: '플러그인',
    subItems: [],
    route: 'usermanage/plugins',
  },
  {
    key: 'admin',
    label: '관리',
    subItems: [
      { label: '블로그', route: 'usermanage/admin/blog' },
      { label: '팀 블로그', route: 'usermanage/admin/team' },
    ],
  },
];

export default function Sidebar() {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();

  // /[name]/usermanage/xxx 에서 name 추출
  const segments = pathname.split('/');
  const name = segments[1] || ''; // e.g., "junseo"

  const toggleMenu = (key: string) => {
    setExpandedMenu(expandedMenu === key ? null : key);
  };

  return (
    <aside className="w-53 flex-shrink-0 text-gray-800">
      {/* 상단 사용자 정보 영역 */}
      <div className="mb-1 w-53 flex-col justify-center">
        <div className="flex h-54 items-center justify-center border border-gray-300 bg-gray-200">
          <figure className="relative h-54 w-40">
            <Image fill objectFit="contain" src="/defaultProfile.png" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={''} />
          </figure>
        </div>
        <div className="flex h-18 flex-col border border-t-0 border-gray-300 bg-white px-5 py-3">
          <span className="text-base">그냥 뉴비</span>
          <span className="text-sm text-gray-400">sunghyeon@gmail.com</span>
        </div>
      </div>

      <div className="mb-1 border border-neutral-700 bg-neutral-700 py-3">
        <Link href="/" className="ml-5 block text-sm font-medium text-white">
          글쓰기
        </Link>
      </div>

      <div className="flex flex-col border border-gray-300">
        {/* 블로그 정보 */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-5">
          <div className="text-sm font-medium">{name}님 의 블로그</div>
        </div>

        {/* 메뉴 */}
        <nav className="bg-gray-50 text-sm font-medium">
          {menuItems.map((item) => (
            <div key={item.key} className="border-b border-solid border-gray-200">
              <div
                className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors ${
                  expandedMenu === item.key ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleMenu(item.key)}
              >
                <span>{item.label}</span>
                {item.subItems.length > 0 && <span className="text-xs">{expandedMenu === item.key ? '▲' : '▼'}</span>}
              </div>

              {expandedMenu === item.key && item.subItems.length > 0 && (
                <ul className="bg-white text-gray-700">
                  {item.subItems.map((subItem, index) => {
                    const fullRoute = `/${name}/${subItem.route}`;
                    const isActive = pathname === fullRoute;

                    return (
                      <li key={index}>
                        <Link
                          href={fullRoute}
                          className={`block py-2 pl-7 hover:bg-gray-100 ${isActive ? 'bg-blue-100 font-semibold text-blue-700' : ''}`}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
