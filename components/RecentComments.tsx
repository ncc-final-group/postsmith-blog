'use client';

interface Comment {
  id: number;
  author: string;
  content: string;
  postTitle: string;
  createdAt: string;
  avatar: string;
  content_sequence: number;
}

interface RecentCommentsProps {
  comments: Comment[];
  blogAddress?: string;
}

// 이름의 첫 글자로 아바타를 생성하는 컴포넌트
function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  // 프로필 이미지가 있고 기본 이미지가 아닌 경우 사용
  if (avatarUrl && avatarUrl !== '/defaultProfile.png') {
    return <img src={avatarUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  }

  // 이름의 첫 번째 문자 추출
  const firstChar = name ? name.charAt(0).toUpperCase() : '?';

  // 색상 생성 (이름을 기반으로 일관된 색상)
  const getAvatarColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'];
    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = getAvatarColor(name);

  return <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white ${bgColor}`}>{firstChar}</div>;
}

export default function RecentComments({ comments, blogAddress }: RecentCommentsProps) {
  const handleCommentClick = (content_sequence: number) => {
    if (!blogAddress) return;

    // 환경별 URL 생성
    const isDevelopment = process.env.NODE_ENV === 'development';
    const baseUrl = isDevelopment ? `http://${blogAddress}.localhost:3000` : `https://${blogAddress}.${window.location.hostname.split('.').slice(1).join('.')}`;

    const postUrl = `${baseUrl}/posts/${content_sequence}`;

    // 새창으로 열기
    window.open(postUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent, content_sequence: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCommentClick(content_sequence);
    }
  };

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="flex cursor-pointer items-start space-x-3 rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors duration-200 hover:bg-gray-100"
          onClick={() => handleCommentClick(comment.content_sequence)}
          onKeyDown={(e) => handleKeyDown(e, comment.content_sequence)}
          tabIndex={0}
          role="button"
          aria-label={`${comment.postTitle} 게시글로 이동`}
        >
          <UserAvatar name={comment.author} avatarUrl={comment.avatar} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{comment.author}</span>
              <span className="text-sm text-gray-500">{comment.createdAt}</span>
            </div>
            <p className="mt-1 text-gray-700">{comment.content}</p>
            <p className="mt-2 text-sm text-blue-600 hover:text-blue-800">게시글: {comment.postTitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
