import { ReactNode } from 'react';

interface UserBlogLayoutProps {
  children: ReactNode;
  params: {
    subdomain: string;
  };
}

export default function UserBlogLayout({ children, params }: UserBlogLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        {children}
      </div>
    </div>
  );
} 