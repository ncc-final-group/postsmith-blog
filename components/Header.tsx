'use client';

import Image from 'next/image';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default function Header() {
  return (
    <header className="sticky top-0 z-10 min-h-[74px] w-full min-w-[1230px] border-b border-gray-200 bg-white px-4 py-1 shadow-sm">
      <div className="flex flex-shrink-0 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center text-xl font-bold text-black">
            <Image src="/logo.png" alt="Logo" width={144} height={72} className="mr-2 inline-block" />
          </Link>

          <nav className="hidden gap-6 text-gray-700 md:flex">
            <Link href={`${baseUrl}/`}>홈</Link>
            <Link href={`${baseUrl}/feed`}>피드</Link>
            <Link href={`${baseUrl}/theme`}>테마</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
