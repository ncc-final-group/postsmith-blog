import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StatsData {
  date: string;
  views: number;
  visitors: number;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';
type StatType = 'views' | 'visitors';

export default function StatsChart() {
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [statType, setStatType] = useState<StatType>('views');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStatsData(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  // 날짜를 YYYY-MM-DD 형식으로 포맷팅하는 함수
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 날짜에서 일(day)만 추출하는 함수
  const getDayFromDate = (dateStr: string) => {
    return new Date(dateStr).getDate().toString();
  };

  // 날짜에서 "MM월" 형식의 문자열을 반환하는 함수
  const getMonthLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월`;
  };

  // 주차 계산 함수
  const getWeekLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((date.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
    return `${weekNumber}주차`;
  };

  // 기간별 데이터 처리
  const processDataByPeriod = () => {
    if (period === 'daily') {
      // 최근 30일 데이터만 사용하고 날짜별로 합산
      const dailyData = statsData.reduce((acc: { [key: string]: { views: number; visitors: number } }, curr) => {
        const date = new Date(curr.date);
        const dateKey = formatDate(date);
        if (!acc[dateKey]) {
          acc[dateKey] = { views: 0, visitors: 0 };
        }
        acc[dateKey].views += curr.views;
        acc[dateKey].visitors += curr.visitors;
        return acc;
      }, {});

      // 최근 30일의 날짜 배열 생성
      const today = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        return formatDate(date);
      });

      return {
        labels: last30Days.map(date => getDayFromDate(date)),
        data: last30Days.map(date => (dailyData[date]?.[statType] || 0))
      };
    } else if (period === 'weekly') {
      // 최근 15주 데이터
      const weeklyData = statsData.reduce((acc: { [key: string]: { views: number; visitors: number } }, curr) => {
        const weekKey = getWeekLabel(curr.date);
        if (!acc[weekKey]) {
          acc[weekKey] = { views: 0, visitors: 0 };
        }
        acc[weekKey].views += curr.views;
        acc[weekKey].visitors += curr.visitors;
        return acc;
      }, {});

      const weeks = Object.keys(weeklyData).slice(-15);
      return {
        labels: weeks,
        data: weeks.map(week => weeklyData[week][statType])
      };
    } else {
      // 최근 12개월 데이터
      const monthlyData = statsData.reduce((acc: { [key: string]: { views: number; visitors: number } }, curr) => {
        const monthKey = getMonthLabel(curr.date);
        if (!acc[monthKey]) {
          acc[monthKey] = { views: 0, visitors: 0 };
        }
        acc[monthKey].views += curr.views;
        acc[monthKey].visitors += curr.visitors;
        return acc;
      }, {});

      const months = Object.keys(monthlyData).slice(-12);
      return {
        labels: months,
        data: months.map(month => monthlyData[month][statType])
      };
    }
  };

  const processedData = processDataByPeriod();

  const chartData = {
    labels: processedData.labels,
    datasets: [
      {
        data: processedData.data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.1,
        fill: false
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: statType === 'views' ? '조회수 통계' : '방문자수 통계',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${statType === 'views' ? '조회수' : '방문자수'}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawOnChartArea: true,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const buttonStyle = "px-4 py-2 text-sm font-medium rounded-md transition-colors";
  const activeButtonStyle = "bg-teal-500 text-white";
  const inactiveButtonStyle = "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="space-x-2">
          <button
            className={`${buttonStyle} ${statType === 'views' ? activeButtonStyle : inactiveButtonStyle}`}
            onClick={() => setStatType('views')}
          >
            조회수
          </button>
          <button
            className={`${buttonStyle} ${statType === 'visitors' ? activeButtonStyle : inactiveButtonStyle}`}
            onClick={() => setStatType('visitors')}
          >
            방문자수
          </button>
        </div>
        <div className="space-x-2">
          <button
            className={`${buttonStyle} ${period === 'daily' ? activeButtonStyle : inactiveButtonStyle}`}
            onClick={() => setPeriod('daily')}
          >
            일간
          </button>
          <button
            className={`${buttonStyle} ${period === 'weekly' ? activeButtonStyle : inactiveButtonStyle}`}
            onClick={() => setPeriod('weekly')}
          >
            주간
          </button>
          <button
            className={`${buttonStyle} ${period === 'monthly' ? activeButtonStyle : inactiveButtonStyle}`}
            onClick={() => setPeriod('monthly')}
          >
            월간
          </button>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
} 