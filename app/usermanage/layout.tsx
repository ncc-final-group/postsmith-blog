// layout.tsx
import type { Metadata } from 'next';

import Header from '@components/Header';
import Sidebar from '@components/Sidebar';

export const metadata: Metadata = {
  title: '관리자 페이지',
  description: 'PostSmith 관리자 영역',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-w-[1400px] bg-gray-100">
      <Header />

      <div className="relative mx-auto flex min-h-[2000px] w-3/4 min-w-[1400px] px-[40px] pt-[60px] pb-[100px]">
        <Sidebar />
        <main className="ml-10 flex-1">{children}</main>
      </div>
    </div>
  );
}
