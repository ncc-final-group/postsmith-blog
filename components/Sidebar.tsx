'use client';

import { House } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useBlogStore } from '../app/store/blogStore';
import { useUserStore } from '../app/store/userStore';

interface MenuItem {
  key: string;
  label: string;
  subItems: { label: string; route: string }[];
  route?: string;
}

const menuItems: MenuItem[] = [
  {
    key: 'write',
    label: '컨텐츠',
    subItems: [
      { label: '글 관리', route: '/usermanage/posts' },
      { label: '페이지 관리', route: '/usermanage/pages' },
      { label: '카테고리 관리', route: '/usermanage/categories' },
      { label: '공지 관리', route: '/usermanage/notices' },
    ],
  },
  {
    key: 'media',
    label: '미디어',
    subItems: [
      { label: '미디어 관리', route: '/usermanage/media' },
      { label: '파일 업로드', route: '/usermanage/media/upload' },
    ],
  },
  {
    key: 'comments',
    label: '댓글',
    subItems: [{ label: '댓글 관리', route: '/usermanage/comments' }],
  },
  {
    key: 'customize',
    label: '꾸미기',
    subItems: [
      { label: '테마', route: '/usermanage/customize/skin' },
      { label: '메뉴 관리', route: '/usermanage/customize/menu' },
    ],
  },
  {
    key: 'stats',
    label: '통계',
    subItems: [{ label: '통계 관리', route: '/usermanage/stats/visits' }],
  },
  {
    key: 'admin',
    label: '관리',
    subItems: [{ label: '블로그', route: '/usermanage/blogs' }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const segments = pathname?.split('/') || [];
  const name = segments[1] || '';

  // 스토어에서 데이터 가져오기
  const { blogInfo } = useBlogStore();
  const { userInfo } = useUserStore();

  // fallback 값들
  const blogNickname = blogInfo?.nickname || '블로그';
  const userEmail = userInfo?.email || '';
  const profileImage = userInfo?.profile_image || '/defaultProfile.png';

  return (
    <aside className="w-53 flex-shrink-0 text-gray-800">
      {/* 상단 사용자 정보 */}
      <div className="mb-1 w-53 flex-col justify-center">
        <div className="flex h-54 items-center justify-center border border-gray-300 bg-gray-200">
          <figure className="relative h-54 w-40">
            <Image fill style={{ objectFit: 'contain' }} src={profileImage} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt="프로필 이미지" priority />
          </figure>
        </div>
        <div className="flex h-18 flex-col border border-t-0 border-gray-300 bg-white px-5 py-3">
          <span className="text-base">{blogNickname}</span>
          <span className="text-sm text-gray-400">{userEmail}</span>
        </div>
      </div>

      <div className="mb-1 border border-neutral-700 bg-neutral-700 py-3">
        <Link href="/edit" className="ml-5 block text-sm font-medium text-white">
          글쓰기
        </Link>
      </div>

      <div className="flex flex-col border border-gray-300">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 hover:bg-gray-100">
          <Link href="/usermanage" className="flex items-center space-x-1 text-sm font-medium">
            <House className="y-5 w-5 text-gray-400" />
            <span>블로그 관리홈</span>
          </Link>
        </div>

        <nav className="bg-gray-50 text-sm font-medium">
          {menuItems.map((item) => (
            <div key={item.key} className="border-b border-solid border-gray-200">
              <div className="flex items-center justify-between bg-gray-100 px-4 py-3">
                <span>{item.label}</span>
              </div>

              {item.subItems.length > 0 && (
                <ul className="bg-white text-gray-700">
                  {item.subItems.map((subItem, index) => {
                    // 현재 경로가 /usermanage인 경우와 /[name]/usermanage인 경우를 구분
                    let fullRoute;
                    if (pathname === '/usermanage' || pathname?.startsWith('/usermanage/')) {
                      // /usermanage 또는 /usermanage/* 경로인 경우
                      fullRoute = subItem.route;
                    } else {
                      // /[name]/usermanage 경로인 경우
                      fullRoute = `/${name}${subItem.route}`;
                    }
                    const isActive = pathname === fullRoute;

                    return (
                      <li key={index}>
                        <Link href={fullRoute} className={`block py-2 pl-7 hover:bg-gray-100 ${isActive ? 'bg-blue-100 font-semibold text-blue-700' : ''}`}>
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
