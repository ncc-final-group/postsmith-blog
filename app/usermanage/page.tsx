'use client';
import { BarChart3, Edit, FileImage, MessageSquare, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function UserManagePage() {
  const pathname = usePathname();
  const segments = pathname.split('/');
  // usermanage 경로에서 username 추출: /username/usermanage 형태에서 username은 segments[1]
  const username = segments[1] || '';
  
  // 현재 경로가 /usermanage인 경우 (root usermanage)와 /username/usermanage 구분
  const isRootUsermanage = segments.length === 2 && segments[1] === 'usermanage';
  const actualUsername = isRootUsermanage ? '' : username;

  const dashboardItems = [
    {
      title: '글 관리',
      description: '블로그 글과 페이지를 관리하세요',
      icon: Edit,
      href: isRootUsermanage ? '/usermanage/posts' : `/${actualUsername}/usermanage/posts`,
      color: 'bg-blue-500',
    },
    {
      title: '미디어 관리',
      description: '이미지, 동영상, 파일을 관리하세요',
      icon: FileImage,
      href: isRootUsermanage ? '/usermanage/media' : `/${actualUsername}/usermanage/media`,
      color: 'bg-green-500',
    },
    {
      title: '댓글 관리',
      description: '댓글과 방명록을 관리하세요',
      icon: MessageSquare,
      href: isRootUsermanage ? '/usermanage/comments' : `/${actualUsername}/usermanage/comments`,
      color: 'bg-yellow-500',
    },
    {
      title: '방문 통계',
      description: '블로그 방문 통계를 확인하세요',
      icon: BarChart3,
      href: isRootUsermanage ? '/usermanage/stats/visits' : `/${actualUsername}/usermanage/stats/visits`,
      color: 'bg-purple-500',
    },
    {
      title: '꾸미기',
      description: '블로그 테마와 스킨을 설정하세요',
      icon: Settings,
      href: isRootUsermanage ? '/usermanage/customize/skin' : `/${actualUsername}/usermanage/customize/skin`,
      color: 'bg-pink-500',
    },
    {
      title: '블로그 관리',
      description: '블로그 설정을 관리하세요',
      icon: Users,
      href: isRootUsermanage ? '/usermanage/admin/blog' : `/${actualUsername}/usermanage/admin/blog`,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-none mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드
          </h1>
          <p className="text-gray-600">
            {isRootUsermanage ? '블로그를 관리하세요' : `${actualUsername}님의 블로그를 관리하세요`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 group"
            >
              <div className="flex items-center mb-4">
                <div className={`${item.color} p-3 rounded-lg text-white mr-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
              </div>
              <p className="text-gray-600">
                {item.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            빠른 작업
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={isRootUsermanage ? '/usermanage/posts' : `/${actualUsername}/usermanage/posts`}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="text-center">
                <Edit className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                <span className="text-sm text-gray-600 group-hover:text-blue-600">
                  새 글 작성
                </span>
              </div>
            </Link>
            <Link
              href={isRootUsermanage ? '/usermanage/media/upload' : `/${actualUsername}/usermanage/media/upload`}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors group"
            >
              <div className="text-center">
                <FileImage className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-2" />
                <span className="text-sm text-gray-600 group-hover:text-green-600">
                  파일 업로드
                </span>
              </div>
            </Link>
            <Link
              href={isRootUsermanage ? '/usermanage/categories' : `/${actualUsername}/usermanage/categories`}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors group"
            >
              <div className="text-center">
                <Settings className="w-8 h-8 text-gray-400 group-hover:text-yellow-500 mx-auto mb-2" />
                <span className="text-sm text-gray-600 group-hover:text-yellow-600">
                  카테고리 관리
                </span>
              </div>
            </Link>
            <Link
              href={isRootUsermanage ? '/usermanage/stats/visits' : `/${actualUsername}/usermanage/stats/visits`}
              className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors group"
            >
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-2" />
                <span className="text-sm text-gray-600 group-hover:text-purple-600">
                  통계 보기
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
