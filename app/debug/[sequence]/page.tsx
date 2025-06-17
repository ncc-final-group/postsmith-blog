import { notFound } from 'next/navigation';

import { getContentById } from '../../api/tbContents';

export default async function DebugPage({ params }: { params: Promise<{ sequence: string }> }) {
  try {
    const { sequence } = await params;
    // 1. 파라미터 검증 (여기서는 contents 테이블의 id를 사용)
    if (!sequence || isNaN(parseInt(sequence))) {
      notFound();
    }

    // 2. contents 테이블의 id로 직접 조회
    const content = await getContentById(parseInt(sequence));
    if (!content) {
      notFound();
    }

    return (
      <div className="mx-auto max-w-4xl p-8">
        <h1 className="mb-4 text-2xl font-bold">디버그 페이지 - Contents ID {sequence}</h1>

        <div className="mb-6 rounded bg-gray-100 p-4">
          <h2 className="mb-2 text-lg font-semibold">기본 정보</h2>
          <p>
            <strong>Contents ID:</strong> {content.id}
          </p>
          <p>
            <strong>Blog ID:</strong> {content.blog_id}
          </p>
          <p>
            <strong>제목:</strong> {content.title}
          </p>
          <p>
            <strong>시퀀스:</strong> {content.sequence}
          </p>
          <p>
            <strong>타입:</strong> {content.type}
          </p>
          <p>
            <strong>공개여부:</strong> {content.is_public ? 'Public' : 'Private'}
          </p>
          <p>
            <strong>임시저장:</strong> {content.is_temp ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>생성일:</strong> {content.created_at ? new Date(content.created_at).toLocaleString() : 'N/A'}
          </p>
          <p>
            <strong>수정일:</strong> {content.updated_at ? new Date(content.updated_at).toLocaleString() : 'N/A'}
          </p>
        </div>

        <div className="mb-6 rounded bg-blue-50 p-4">
          <h2 className="mb-2 text-lg font-semibold">content_html 정보</h2>
          <p>
            <strong>길이:</strong> {content.content_html?.length || 0} 문자
          </p>
          <p>
            <strong>비어있음:</strong> {!content.content_html || content.content_html.trim() === '' ? 'Yes' : 'No'}
          </p>

          <h3 className="mt-4 mb-2 font-semibold">content_html 원본 (처음 500자):</h3>
          <pre className="overflow-x-auto rounded border bg-white p-2 text-xs">{content.content_html?.substring(0, 500) || 'No content_html'}</pre>
        </div>

        <div className="mb-6 rounded bg-green-50 p-4">
          <h2 className="mb-2 text-lg font-semibold">content_plain 정보</h2>
          <p>
            <strong>길이:</strong> {content.content_plain?.length || 0} 문자
          </p>

          <h3 className="mt-4 mb-2 font-semibold">content_plain 원본 (처음 500자):</h3>
          <pre className="overflow-x-auto rounded border bg-white p-2 text-xs">{content.content_plain?.substring(0, 500) || 'No content_plain'}</pre>
        </div>

        <div className="mb-6 rounded bg-yellow-50 p-4">
          <h2 className="mb-2 text-lg font-semibold">content_html 렌더링 테스트</h2>
          <div className="editor-content rounded border bg-white p-4" dangerouslySetInnerHTML={{ __html: content.content_html || '<p>내용이 없습니다.</p>' }} />
        </div>

        <div className="mb-6 rounded bg-purple-50 p-4">
          <h2 className="mb-2 text-lg font-semibold">전체 content 객체</h2>
          <pre className="overflow-x-auto rounded border bg-white p-2 text-xs">{JSON.stringify(content, null, 2)}</pre>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">에러 발생</h1>
        <p className="mt-4">에러 메시지: {error instanceof Error ? error.message : '알 수 없는 에러'}</p>
      </div>
    );
  }
}
