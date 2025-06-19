'use client';

import { useEffect } from 'react';

import { getBlogByAddress } from '../api/tbBlogs';
import { useBlogStore } from '../store/blogStore';

function extractSubdomain(host: string): string {
  // address.localhost:3000 형태에서 address 추출
  if (host.includes('.localhost')) {
    return host.split('.localhost')[0];
  }

  // address.domain.com 형태에서 address 추출
  if (host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return parts[0];
    }
  }

  // 기본값
  return 'testblog';
}

export function useBlog(address?: string) {
  const { blogId, blogInfo, isLoading, error, setBlogInfo, setLoading, setError, clearBlog } = useBlogStore();

  const fetchBlog = async (blogAddress: string) => {
    // 현재 호스트에서 subdomain 추출
    const currentHost = window.location.host;
    const currentSubdomain = extractSubdomain(currentHost);

    // 요청된 주소와 현재 subdomain이 다르면 현재 subdomain 사용
    const targetAddress = blogAddress || currentSubdomain;

    if (blogInfo && blogInfo.address === targetAddress) {
      return blogInfo;
    }

    setLoading(true);
    setError(null);

    try {
      const blog = await getBlogByAddress(targetAddress);
      if (blog) {
        const blogData = {
          id: blog.id,
          nickname: blog.nickname,
          description: blog.description,
          logo_image: blog.logo_image,
          address: blog.address,
        };
        setBlogInfo(blogData);
        return blogData;
      } else {
        setError(`블로그를 찾을 수 없습니다. (${targetAddress})`);
        return null;
      }
    } catch (err) {
      setError('블로그 정보를 가져오는 중 오류가 발생했습니다.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host;
      const currentSubdomain = extractSubdomain(currentHost);
      const targetAddress = address || currentSubdomain;

      if (!blogInfo || blogInfo.address !== targetAddress) {
        fetchBlog(targetAddress);
      }
    }
  }, [address]);

  return {
    blogId,
    blogInfo,
    isLoading,
    error,
    fetchBlog,
    clearBlog,
  };
}
