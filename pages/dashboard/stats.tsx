import type { NextPage } from 'next';
import StatsChart from '../../components/StatsChart';

const StatsPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">조회수 통계</h1>
        <div className="bg-white rounded-lg border border-gray-300 p-4">
          <StatsChart />
        </div>
      </div>
    </div>
  );
};

export default StatsPage; 