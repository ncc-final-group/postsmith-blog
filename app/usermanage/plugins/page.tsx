import PluginList, { Plugin } from '../../../components/PluginList';

const plugins: Plugin[] = [
  { id: 'daum', name: 'Daum 검색창', description: '블로그에 Daum 검색창을 추가합니다.', color: '#ffe066', iconUrl: undefined },
  { id: 'drag', name: '드래그 검색', description: '드래그한 텍스트를 바로 검색할 수 있습니다.', color: '#6ec6ff', iconUrl: undefined },
  { id: 'prev-url', name: '이전 방문글 링크 삽입', description: '이전 방문한 글의 링크를 본문에 삽입합니다.', color: '#f8bbd0', iconUrl: undefined },
  { id: 'category', name: '카테고리 글 더보기', description: '카테고리별로 더 많은 글을 보여줍니다.', color: '#bdbdbd', iconUrl: undefined },
  { id: 'syntax', name: 'Syntax Highlight', description: '코드에 구문 강조를 적용합니다.', color: '#b0bec5', iconUrl: undefined },
  { id: 'youtube', name: 'Youtube 동영상 첨부', description: 'Youtube 동영상을 쉽게 첨부할 수 있습니다.', color: '#fff', iconUrl: undefined },
  { id: 'search-console', name: 'Google Search Console', description: '구글 서치콘솔 연동', color: '#fff', iconUrl: undefined },
  { id: 'analytics', name: 'Google Analytics', description: '구글 애널리틱스 연동', color: '#fffde7', iconUrl: undefined },
  { id: 'text', name: '그림 문자', description: '특수문자, 그림문자 입력', color: '#b2ebf2', iconUrl: undefined },
  { id: 'naver', name: '네이버 애널리틱스', description: '네이버 애널리틱스 연동', color: '#388e3c', iconUrl: undefined },
  { id: 'emoticon', name: '이모티콘 표시', description: '댓글/방명록에 이모티콘 표시', color: '#c8e6c9', iconUrl: undefined },
  { id: 'mouse', name: '마우스 오버효과/클릭방지', description: '마우스 오버효과, 클릭방지 기능', color: '#b39ddb', iconUrl: undefined },
  { id: 'meta', name: '메타 태그 등록', description: '메타 태그를 쉽게 등록', color: '#757575', iconUrl: undefined },
  { id: 'nofollow', name: '무지개 링크', description: '무지개 색상 링크 효과', color: '#ff8a65', iconUrl: undefined },
  { id: 'responsive', name: '반응형 웹스킨/이미지 최적화', description: '반응형 웹스킨, 이미지 최적화', color: '#4dd0e1', iconUrl: undefined },
  { id: 'visitor-graph', name: '방문자 통계 그래프', description: '방문자 통계를 그래프로 표시', color: '#f06292', iconUrl: undefined },
  { id: 'banner', name: '배너 출력', description: '배너를 출력합니다.', color: '#fff9c4', iconUrl: undefined },
  { id: 'blogicon', name: '블로그 아이콘 표시', description: '블로그 아이콘을 표시합니다.', color: '#b2dfdb', iconUrl: undefined },
  { id: 'biz', name: '사업자 정보 표시', description: '사업자 정보를 표시합니다.', color: '#81d4fa', iconUrl: undefined },
  { id: 'livere', name: '소셜댓글 LiveRe', description: 'LiveRe 소셜댓글 연동', color: '#fff', iconUrl: undefined },
  { id: 'copyright', name: '저작권자 표시', description: '저작권자 정보를 표시합니다.', color: '#a5d6a7', iconUrl: undefined },
  { id: 'tag', name: '태그 입력기', description: '태그 입력기 플러그인', color: '#90caf9', iconUrl: undefined },
  { id: 'favicon', name: '홈페이지 아이콘 표시', description: '홈페이지 파비콘 표시', color: '#b3e5fc', iconUrl: undefined },
];

const activePluginIds = ['daum', 'prev-url', 'category', 'visitor-graph'];

export default function PluginsPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <PluginList plugins={plugins} activePluginIds={activePluginIds} />
    </main>
  );
}
