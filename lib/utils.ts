export function getSubdomain(): string {
  if (typeof window === 'undefined') return '';
  
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost')) {
    // localhost 환경에서 subdomain 확인 (예: blog.localhost:3000)
    const parts = hostname.split('.');
    if (parts.length > 1 && !parts[0].startsWith('localhost')) {
      return parts[0];
    }
  } else if (hostname.includes('.')) {
    // 실제 도메인에서 subdomain 확인 (예: blog.yourdomain.com)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
  }
  
  return '';
} 

export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0];
} 