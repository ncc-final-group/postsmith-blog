import { Metadata } from 'next';
import AuthStatus from '../../components/AuthStatus';


export const metadata: Metadata = {
  title: '인증 상태 확인 | PostSmith Blog',
  description: '현재 로그인 상태와 사용자 정보를 확인할 수 있는 페이지입니다.',
};

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">인증 상태 확인</h1>
          <p className="text-gray-600">현재 로그인 상태와 사용자 정보를 확인해보세요.</p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* AuthStatus 컴포넌트 렌더링 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">인증 상태</h2>
            <AuthStatus />
          </div>

          {/* 추가 정보 카드 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">인증 기능 안내</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="font-medium text-blue-900">🔐 로그인 상태</p>
                <p>현재 사용자의 로그인 여부를 실시간으로 확인할 수 있습니다.</p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-md">
                <p className="font-medium text-green-900">👤 사용자 정보</p>
                <p>로그인된 사용자의 ID, 닉네임, 이메일 정보를 표시합니다.</p>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-md">
                <p className="font-medium text-purple-900">⚡ 편의 함수</p>
                <p>userStore에서 제공하는 편의 함수들의 사용 예시를 보여줍니다.</p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-md">
                <p className="font-medium text-yellow-900">🔄 실시간 업데이트</p>
                <p>로그인/로그아웃 시 자동으로 상태가 업데이트됩니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">로그인/로그아웃</h2>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800">
              <strong>💡 안내:</strong> 로그인/로그아웃은 우상단의 프로필 버튼을 클릭하여 이용할 수 있습니다.
            </p>
            <p className="text-blue-700 text-sm mt-2">
              • 로그인되지 않은 경우: 프로필 아이콘 → "🔑 로그인하기" 버튼 클릭<br/>
              • 로그인된 경우: 프로필 드롭다운 → "🚪 로그아웃" 버튼 클릭
            </p>
          </div>
        </div>

        {/* 개발자 정보 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>AuthStatus 컴포넌트 렌더링 테스트 페이지</p>
          <p>경로: /auth</p>
        </div>
      </div>
    </div>
  );
} 