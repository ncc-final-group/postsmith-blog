import SkinList, { Skin } from '../../../../components/SkinList';

const skins: Skin[] = [
  { id: 'odyssey', name: 'Odyssey', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
  { id: 'poster', name: 'Poster', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' },
  { id: 'whatever', name: 'Whatever', thumbnail: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308' },
  { id: 'letter', name: 'Letter', thumbnail: 'https://images.unsplash.com/photo-1464983953574-0892a716854b' },
  { id: 'portfolio', name: 'Portfolio', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99' },
  { id: 'bookclub', name: 'Book Club', thumbnail: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2' },
  { id: 'magazine', name: 'Magazine', thumbnail: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca' },
  { id: 'square', name: 'Square', thumbnail: 'https://images.unsplash.com/photo-1465101178521-c1a9136a3b99' },
];

export default function SkinPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">스킨 관리</h1>
        <SkinList skins={skins} activeSkinId="odyssey" />
      </div>
    </main>
  );
}
