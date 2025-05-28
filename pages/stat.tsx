import type { NextPage } from 'next';
import StatsChart from '../components/StatsChart';

const StatPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="mb-4 text-2xl font-bold">조회수 통계</h1>
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <StatsChart />
        </div>
      </div>
    </div>
  );
};

export default StatPage;
