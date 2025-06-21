import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import { headers } from 'next/headers';

import './globals.css';
import '../styles/editor-content.css';
import BlogProvider from '../components/BlogProvider';
import ClientSessionProvider from '../components/ClientSessionProvider';
import ConditionalUserDropdown from '../components/ConditionalUserDropdown';
import { getSessionFromRedis } from '../lib/sessionUtils';
import { getBlogByAddress } from './api/tbBlogs';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PostSmith',
  description: '블로그 포스팅해주는 서비스인데, 뭐라고 써야 하나. 아무튼 포스팅해주는 서비스임',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Redis에서 세션 정보 읽기
  const sessionData = await getSessionFromRedis();

  // 현재 호스트에서 subdomain 추출
  const headersList = await headers();
  const hostname = headersList.get('host') || headersList.get('authority') || '';

  let subdomain = '';
  let blog = null;

  if (hostname.includes('.postsmith.kro.kr')) {
    subdomain = hostname.split('.postsmith.kro.kr')[0];
  } else if (hostname.includes('.')) {
    const parts = hostname.split('.');
    // localhost 환경에서는 첫 번째 부분이 address가 됨 (address.localhost)
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  }
  // subdomain이 있으면 블로그 정보 조회
  if (subdomain) {
    try {
      blog = await getBlogByAddress(subdomain);
    } catch (error) {
      // 블로그 조회 실패 시 무시
    }
  }

  return (
    <html lang="ko">
      <body id="tt-body-index">
        <ClientSessionProvider sessionData={sessionData || null}>
          {blog ? (
            <BlogProvider
              blogInfo={{
                id: blog.id,
                nickname: blog.nickname,
                description: blog.description,
                logo_image: blog.logo_image,
                address: blog.address,
              }}
            >
              {children}
              <ConditionalUserDropdown />
            </BlogProvider>
          ) : (
            <>
              {children}
              <ConditionalUserDropdown />
            </>
          )}
        </ClientSessionProvider>
      </body>
    </html>
  );
}
