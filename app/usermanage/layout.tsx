// layout.tsx
import { getBlogAddress } from '../../lib/blogUtils';
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
  // 블로그 정보 가져오기 (메인 페이지와 동일한 방식)
  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);

  const content = (
    <div className="min-h-screen min-w-[1400px] bg-gray-100">
      <Header />

      <div className="relative mx-auto flex min-h-[2000px] w-3/4 min-w-[1400px] px-[40px] pt-[60px] pb-[100px]">
        <Sidebar />
        <main className="ml-10 flex-1">{children}</main>
      </div>
    </div>
  );

  // 블로그 정보가 있으면 BlogProvider로 감싸기
  if (blog) {
    return (
      <BlogProvider
        blogInfo={{
          id: blog.id,
          nickname: blog.nickname,
          description: blog.description,
          logo_image: blog.logo_image,
          address: blog.address,
        }}
      >
        {content}
      </BlogProvider>
    );
  }

  return content;
}
