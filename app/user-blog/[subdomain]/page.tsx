import { notFound } from 'next/navigation';
import { getBlogByAddress } from '../../api/tbBlogs';
import { getContentsByBlogId } from '../../api/tbContents';
import Link from 'next/link';
import Image from 'next/image';

interface PageProps {
  params: {
    subdomain: string;
  };
}

interface Blog {
  id: number;
  user_id: number;
  name: string;
  address: string;
  description: string;
  logo_image?: string;
  created_at: string;
  updated_at: string;
}

interface Content {
  id: number;
  blog_id: number;
  sequence: number;
  category_id?: number;
  type: string;
  title: string;
  content_html: string;
  content_plain: string;
  is_temp: boolean;
  is_public: boolean;
  likes: number;
  created_at: string;
  updated_at: string;
}

export default async function UserBlogPage({ params }: PageProps) {
  // subdomain으로 블로그 찾기
  const blog: Blog | null = await getBlogByAddress(params.subdomain);
  
  if (!blog) {
    notFound();
  }

  // 해당 블로그의 공개 포스트들 가져오기
  const contents: Content[] = await getContentsByBlogId(blog.id);
  const publicContents = contents.filter(content => content.is_public && !content.is_temp);

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* 블로그 헤더 */}
      <div className="text-center mb-12">
        {blog.logo_image && (
          <div className="mb-4">
            <Image
              src={blog.logo_image}
              alt={`${blog.name} 로고`}
              width={120}
              height={120}
              className="mx-auto rounded-full"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{blog.name}</h1>
        {blog.description && (
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{blog.description}</p>
        )}
      </div>

      {/* 포스트 목록 */}
      <div className="space-y-8">
        {publicContents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">아직 작성된 포스트가 없습니다.</p>
          </div>
        ) : (
          publicContents.map((content) => (
            <article key={content.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <Link href={`/user-blog/${params.subdomain}/posts/${content.sequence}`} className="block">
                <h2 className="text-2xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                  {content.title}
                </h2>
                <div 
                  className="text-gray-600 mb-4 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: content.content_plain.substring(0, 200) + (content.content_plain.length > 200 ? '...' : '') }}
                />
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <time dateTime={content.created_at}>
                    {new Date(content.created_at).toLocaleDateString('ko-KR')}
                  </time>
                  <div className="flex items-center space-x-4">
                    <span>❤️ {content.likes}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  );
} 