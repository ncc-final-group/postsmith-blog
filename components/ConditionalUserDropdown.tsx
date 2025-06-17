'use client';

import { usePathname } from 'next/navigation';
import UserDropdown from './UserDropdown';

export default function ConditionalUserDropdown() {
  const pathname = usePathname();
  
  // usermanage 경로에서는 UserDropdown을 표시하지 않음
  if (pathname.startsWith('/usermanage')) {
    return null;
  }
  
  return <UserDropdown />;
} 