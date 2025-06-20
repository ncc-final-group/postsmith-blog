import { BarChart3, Edit, FileImage, MessageSquare, Settings, Users } from 'lucide-react';
import Link from 'next/link';

import { getCurrentUser } from '../../lib/auth';
import { getAdminSidebarData, getSidebarData } from '../api/sidebarData';
import { getBlogByAddress } from '../api/tbBlogs';
import { getBlogAddress } from '../../lib/blogUtils';

import HotPosts from '@components/HotPosts';
import RecentComments from '@components/RecentComments';
import RecentPosts from '@components/RecentPosts';

// HTML 컨텐츠에서 첫 번째 이미지 URL 추출하는 함수
function extractFirstImageFromHtml(htmlContent: string): string | undefined {
  if (!htmlContent) return undefined;

  // img 태그의 src 속성을 찾는 정규표현식
  const imgRegex = /<img[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/i;
  const match = htmlContent.match(imgRegex);

  return match ? match[1] : undefined;
}

// 사이드바 데이터를 Post 형식으로 변환하는 함수
function transformRecentContents(recentContents: any[]) {
  return recentContents.map((content) => ({
    id: content.sequence,
    title: content.title,
    excerpt: content.content_plain.substring(0, 100) + (content.content_plain.length > 100 ? '...' : ''),
    imageUrl: content.thumbnail || extractFirstImageFromHtml(content.content_html),
    commentCount: content.reply_count || 0,
    likeCount: 0, // API에서 제공되지 않으므로 0으로 설정
  }));
}

function transformPopularContents(popularContents: any[]) {
  return popularContents.map((content) => ({
    id: content.sequence,
    title: content.title,
    excerpt: `조회수 ${content.recent_visit_count || 0} · 댓글 ${content.recent_reply_count || 0}`,
    imageUrl: undefined, // 인기글에는 썸네일이 없음
    commentCount: content.recent_reply_count || 0,
    likeCount: content.popularity_score || 0,
  }));
}

export default async function UserManagePage() {
  // 현재 블로그와 사용자 정보 가져오기
  const subdomain = await getBlogAddress();
  const blog = await getBlogByAddress(subdomain);
  const currentUser = await getCurrentUser();

  let sidebarData = null;
  let recentComments: any[] = [];
  let recentPosts: any[] = [];
  let hotPosts: any[] = [];

  if (blog) {
    // 블로그 소유자인지 확인
    const isOwner = currentUser && currentUser.id === blog.user_id;
    const ownerUserId = isOwner ? currentUser.id : undefined;

    // 관리자 대시보드용 사이드바 데이터 가져오기 (블로그 소유자 제외한 댓글)
    sidebarData = await getAdminSidebarData(blog.id, blog.user_id, ownerUserId);

    // 데이터 변환
    recentPosts = transformRecentContents(sidebarData.recentContents);
    hotPosts = transformPopularContents(sidebarData.popularContents);
    recentComments = sidebarData.recentReplies.map((reply: any) => ({
      id: reply.id,
      author: reply.user.nickname,
      content: reply.content,
      postTitle: reply.content_title,
      createdAt: new Date(reply.created_at).toLocaleString('ko-KR'),
      avatar: reply.user.profile_image || '/defaultProfile.png', // DB의 profile_image 사용, 없으면 기본 이미지
      content_sequence: reply.content_sequence,
    }));
  }

  // URL 경로 분석 (클라이언트 사이드 로직을 서버 사이드로 이동)
  const isRootUsermanage = true; // 서버 컴포넌트에서는 단순화
  const actualUsername = blog?.address || '';

  const dashboardItems = [
    {
      title: '글 관리',
      description: '블로그 글과 페이지를 관리하세요',
      icon: Edit,
      href: '/usermanage/posts',
      color: 'bg-blue-500',
    },
    {
      title: '미디어 관리',
      description: '이미지, 동영상, 파일을 관리하세요',
      icon: FileImage,
      href: '/usermanage/media',
      color: 'bg-green-500',
    },
    {
      title: '댓글 관리',
      description: '댓글과 방명록을 관리하세요',
      icon: MessageSquare,
      href: '/usermanage/comments',
      color: 'bg-yellow-500',
    },
    {
      title: '방문 통계',
      description: '블로그 방문 통계를 확인하세요',
      icon: BarChart3,
      href: '/usermanage/stats/visits',
      color: 'bg-purple-500',
    },
    {
      title: '꾸미기',
      description: '블로그 테마와 스킨을 설정하세요',
      icon: Settings,
      href: '/usermanage/customize/skin',
      color: 'bg-pink-500',
    },
    {
      title: '블로그 관리',
      description: '블로그 설정을 관리하세요',
      icon: Users,
      href: '/usermanage/blogs',
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-none">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="text-gray-600">{blog ? `${blog.nickname} 블로그를 관리하세요` : '블로그를 관리하세요'}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboardItems.map((item, index) => (
            <Link key={index} href={item.href} className="group block rounded-lg bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg">
              <div className="mb-4 flex items-center">
                <div className={`${item.color} mr-4 rounded-lg p-3 text-white`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600">{item.title}</h3>
              </div>
              <p className="text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>

        {/* 최근 댓글, 최근 글, 인기글 섹션 */}
        <div className="mt-12 space-y-6">
          {recentComments.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">최근 댓글</h2>
              <RecentComments comments={recentComments.slice(0, 4)} blogAddress={blog?.address} />
            </div>
          )}

          {recentPosts.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">최근 게시글</h2>
              <RecentPosts posts={recentPosts} blogAddress={blog?.address} itemsPerPage={4} />
            </div>
          )}

          {hotPosts.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">인기 게시글</h2>
              <HotPosts posts={hotPosts} blogAddress={blog?.address} itemsPerPage={4} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
