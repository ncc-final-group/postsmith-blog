export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
        
        <div className="animate-pulse">
          {/* 사용중인 스킨 로딩 */}
          <section className="mb-8">
            <div className="mb-2 h-6 w-32 bg-gray-300 rounded"></div>
            <div className="flex items-center gap-4 rounded-lg border bg-gray-50 p-4">
              <div className="h-20 w-30 bg-gray-300 rounded-md"></div>
              <div className="h-6 w-24 bg-gray-300 rounded"></div>
            </div>
          </section>

          {/* 스킨 목록 로딩 */}
          <section>
            <div className="mb-2 h-6 w-20 bg-gray-300 rounded"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="rounded-lg border bg-white p-3">
                  <div className="mb-2 h-30 w-full bg-gray-300 rounded-md"></div>
                  <div className="h-4 w-20 bg-gray-300 rounded mx-auto"></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
} 