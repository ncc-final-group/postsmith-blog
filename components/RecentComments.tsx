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
          <img src={comment.avatar} alt={comment.author} className="h-10 w-10 rounded-full object-cover" />
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
