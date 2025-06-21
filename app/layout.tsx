import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import '../styles/editor-content.css';
import BlogInitializer from '../components/BlogInitializer';
import ClientSessionProvider from '../components/ClientSessionProvider';
import ConditionalUserDropdown from '../components/ConditionalUserDropdown';
import { getSessionFromRedis } from '../lib/sessionUtils';

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

  return (
    <html lang="ko">
      <body id="tt-body-index">
        <ClientSessionProvider sessionData={sessionData || null}>
          <BlogInitializer />
          {children}
          <ConditionalUserDropdown />
        </ClientSessionProvider>
      </body>
    </html>
  );
}
