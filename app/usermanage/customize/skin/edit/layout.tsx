import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '스킨 편집',
  description: 'PostSmith 스킨 편집 도구',
};

export default function SkinEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
} 