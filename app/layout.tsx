import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

import './globals.css';
import '../styles/editor-content.css';
import UserProvider from './components/UserProvider';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body id="tt-body-index">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
