import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mb-4 text-2xl font-semibold text-gray-700">블로그를 찾을 수 없습니다</h2>
          <p className="mb-8 text-gray-500">요청하신 블로그가 존재하지 않거나, 해당 포스트를 찾을 수 없습니다.</p>
        </div>

        <div className="space-y-4">
          <div>
            <Link href="/" className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700">
              메인 페이지로 돌아가기
            </Link>
          </div>
          <div>
            <p className="text-sm text-gray-500">블로그 주소를 다시 확인해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
