import { getAllContents } from '../../api/tbContents';

export default async function DebugListPage() {
  try {
    // 모든 contents 조회
    const contents = await getAllContents();

    return (
      <div className="mx-auto max-w-6xl p-8">
        <h1 className="mb-4 text-2xl font-bold">디버그 페이지 - 모든 Contents 목록</h1>

        <div className="mb-4">
          <p>
            <strong>총 {contents.length}개의 contents가 있습니다.</strong>
          </p>
        </div>

        <div className="grid gap-4">
          {contents.map((content: any) => (
            <div key={content.id} className="rounded-lg border bg-gray-50 p-4">
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <strong>ID:</strong> {content.id}
                </div>
                <div>
                  <strong>Blog ID:</strong> {content.blog_id}
                </div>
                <div>
                  <strong>Sequence:</strong> {content.sequence}
                </div>
                <div>
                  <strong>Type:</strong> {content.type}
                </div>
              </div>

              <div className="mb-2">
                <strong>제목:</strong> {content.title}
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <strong>content_html 길이:</strong> {content.content_html?.length || 0}
                  <div className="text-sm text-gray-600">비어있음: {!content.content_html || content.content_html.trim() === '' ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <strong>content_plain 길이:</strong> {content.content_plain?.length || 0}
                  <div className="text-sm text-gray-600">비어있음: {!content.content_plain || content.content_plain.trim() === '' ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <strong>공개:</strong> {content.is_public ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>임시저장:</strong> {content.is_temp ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>생성일:</strong> {content.created_at ? new Date(content.created_at).toLocaleString() : 'N/A'}
                </div>
                <div>
                  <strong>수정일:</strong> {content.updated_at ? new Date(content.updated_at).toLocaleString() : 'N/A'}
                </div>
              </div>

              {content.content_html && content.content_html.trim() !== '' && (
                <div className="mt-4">
                  <strong>content_html 미리보기 (처음 200자):</strong>
                  <pre className="mt-2 overflow-x-auto rounded border bg-white p-2 text-xs">{content.content_html.substring(0, 200)}...</pre>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <a href={`/debug/${content.id}`} className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600">
                  상세보기 (ID: {content.id})
                </a>
                {content.blog_id && content.sequence && (
                  <a href={`/posts/${content.sequence}`} className="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600">
                    실제 페이지 (Seq: {content.sequence})
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {contents.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-gray-500">데이터베이스에 contents가 없습니다.</p>
          </div>
        )}
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
