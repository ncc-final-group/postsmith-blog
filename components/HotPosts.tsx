'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';

interface Post {
  id: string | number;
  title: string;
  excerpt: string;
  imageUrl?: string;
  commentCount: number;
  likeCount: number;
}

interface HotPostsProps {
  posts: Post[];
  blogAddress?: string;
  itemsPerPage?: number;
}

export default function HotPosts({ posts, blogAddress, itemsPerPage = 4 }: HotPostsProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  const currentPosts = posts.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

  const handlePostClick = (postId: string | number) => {
    let postUrl: string;

    if (blogAddress) {
      // 개발 환경 또는 서브도메인 방식
      if (window.location.hostname.includes('localhost')) {
        postUrl = `http://${blogAddress}.localhost:${window.location.port}/posts/${postId}`;
      } else {
        // 프로덕션 환경
        postUrl = `https://${blogAddress}.${window.location.hostname}/posts/${postId}`;
      }
    } else {
      // 현재 도메인에서 게시글 경로
      postUrl = `/posts/${postId}`;
    }

    window.open(postUrl, '_blank', 'noopener,noreferrer');
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="w-full rounded-lg bg-gray-50 px-6 py-4">
      <h2 className="mb-4 text-2xl font-semibold text-black">인기 글</h2>
      <div className="relative">
        {/* 왼쪽 화살표 버튼 */}
        {currentPage > 0 && (
          <button
            onClick={goToPrevPage}
            className="absolute top-1/2 left-[-20px] z-10 -translate-y-1/2 transform rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* 오른쪽 화살표 버튼 */}
        {currentPage < totalPages - 1 && (
          <button
            onClick={goToNextPage}
            className="absolute top-1/2 right-[-20px] z-10 -translate-y-1/2 transform rounded-full bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* 게시글 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {currentPosts.map((post) => (
            <div
              key={post.id}
              className="flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow duration-200 hover:shadow-lg"
              onClick={() => handlePostClick(post.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePostClick(post.id);
                }
              }}
            >
              {post.imageUrl && (
                <figure className="relative h-40 w-full">
                  <Image src={post.imageUrl} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                </figure>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 text-lg font-medium text-black transition-colors hover:text-blue-600">{post.title}</div>
                <div className="mb-4 line-clamp-3 text-sm text-gray-500">{post.excerpt}</div>
                <div className="mt-auto text-xs text-gray-400">
                  댓글 {post.commentCount} ・ 공감 {post.likeCount}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지 인디케이터 */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center space-x-2">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-2 w-2 rounded-full transition-colors ${index === currentPage ? 'bg-blue-600' : 'bg-gray-300'}`}
                aria-label={`페이지 ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
