import Image from 'next/image';
import React from 'react';

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
}

export default function HotPosts({ posts }: HotPostsProps) {
  return (
    <div className="w-full rounded-lg bg-gray-50 px-6 py-4">
      <h2 className="mb-4 text-2xl font-semibold text-black">인기 글</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => (
          <div key={post.id} className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
            {post.imageUrl && (
              <figure className="relative h-40 w-full">
                <Image src={post.imageUrl} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              </figure>
            )}
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-2 text-lg font-medium text-black">{post.title}</div>
              <div className="mb-4 line-clamp-3 text-sm text-gray-500">{post.excerpt}</div>
              <div className="mt-auto text-xs text-gray-400">
                댓글 {post.commentCount} ・ 공감 {post.likeCount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
