// layout.tsx
import { headers } from 'next/headers';

import { getBlogByAddress } from '../api/tbBlogs';

import type { Metadata } from 'next';

import BlogProvider from '@components/BlogProvider';
import Header from '@components/Header';
import Sidebar from '@components/Sidebar';


export const metadata: Metadata = {
  title: '관리자 페이지',
  description: 'PostSmith 관리자 영역',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 현재 호스트에서 subdomain 추출
  const headersList = await headers();
  const hostname = headersList.get('host') || '';

  let subdomain = '';
  if (hostname.includes('.postsmith.kro.kr')) {
    subdomain = hostname.split('.postsmith.kro.kr')[0];
  } else if (hostname.includes('.')) {
    subdomain = hostname.split('.')[0];
  }

  if (!subdomain) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">블로그 주소를 찾을 수 없습니다</h1>
          <p className="text-gray-600">올바른 블로그 주소로 접속해주세요.</p>
        </div>
      </div>
    );
  }

  // 현재 블로그 정보 가져오기
  const blog = await getBlogByAddress(subdomain);

  if (!blog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">블로그를 찾을 수 없습니다</h1>
          <p className="text-gray-600">블로그 주소: {subdomain}</p>
          <p className="text-gray-600">올바른 블로그 주소로 접속해주세요.</p>
        </div>
      </div>
    );
  }

  const blogInfo = {
    id: blog.id,
    nickname: blog.nickname,
    description: blog.description,
    logo_image: blog.logo_image,
    address: blog.address,
  };

  return (
    <BlogProvider blogId={blog.id} blogInfo={blogInfo}>
      <div className="min-h-screen min-w-[1400px] bg-gray-100">
        <Header />

        <div className="relative mx-auto flex min-h-[2000px] w-3/4 min-w-[1400px] px-[40px] pt-[60px] pb-[100px]">
          <Sidebar />
          <main className="ml-10 flex-1">{children}</main>
        </div>
      </div>
    </BlogProvider>
  );
}
