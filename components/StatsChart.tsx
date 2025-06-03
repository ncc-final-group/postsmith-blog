'use client';

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, crosshairPlugin);

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
        throw new Error('Failed to fetch stats: ' + error);
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

  // 주차 계산 함수 (월요일 기준)
  const getWeekLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
    const monday = new Date(date.setDate(diff));
    return monday.getDate().toString();
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

      // 월이 바뀌는 지점 찾기
      const monthLabels = last30Days.reduce((acc: { [key: string]: number }, date, index) => {
        const month = new Date(date).getMonth() + 1;
        if (!acc[month]) {
          acc[month] = index;
        }
        return acc;
      }, {});

      return {
        labels: last30Days.map((date) => {
          const currentDate = new Date(date);
          const day = currentDate.getDate();
          const month = currentDate.getMonth() + 1;
          // 월이 바뀌는 지점에서만 월 표시
          if (monthLabels[month] === last30Days.indexOf(date)) {
            return [`${day}`, `${month}월`];
          }
          return `${day}`;
        }),
        data: last30Days.map((date) => dailyData[date]?.[statType] || 0),
        monthLabels,
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

      // 월이 바뀌는 지점 찾기
      const monthLabels = weeks.reduce((acc: { [key: string]: number }, week, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (14 - index) * 7);
        const month = date.getMonth() + 1;
        if (!acc[month]) {
          acc[month] = index;
        }
        return acc;
      }, {});

      // 날짜를 순차적으로 표시하기 위한 배열 생성
      const sequentialDates = Array.from({ length: 15 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (14 - i) * 7);
        return date.getDate().toString();
      });

      return {
        labels: sequentialDates.map((date, index) => {
          const currentDate = new Date();
          currentDate.setDate(currentDate.getDate() - (14 - index) * 7);
          const month = currentDate.getMonth() + 1;
          if (monthLabels[month] === index) {
            return [`${date}`, `${month}월`];
          }
          return date;
        }),
        data: weeks.map((week) => weeklyData[week][statType]),
        monthLabels,
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

      // 연도가 바뀌는 지점 찾기
      const baseDate = new Date();
      const yearLabels = months.reduce((acc: { [key: string]: number }, month, index) => {
        const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 11 + index);
        const year = date.getFullYear().toString();
        if (!acc[year]) {
          acc[year] = index;
        }
        return acc;
      }, {});

      return {
        labels: months,
        data: months.map((month) => monthlyData[month][statType]),
        yearLabels,
      };
    }
  };

  const processedData = processDataByPeriod();

  const chartData = {
    labels: processedData.labels.map((label) => (Array.isArray(label) ? label[0] : label)),
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
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${statType === 'views' ? '조회수' : '방문자수'}: ${context.parsed.y}`;
          },
        },
        intersect: false,
        mode: 'index' as const,
      },
      crosshair: {
        line: {
          color: 'rgba(75, 192, 192, 0.6)',
          width: 1,
          dashPattern: [5, 5],
        },
        sync: { enabled: true },
        zoom: { enabled: false },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawOnChartArea: true,
        },
        ticks: {
          callback: function (this: { getLabelForValue: (value: any) => string }, value: any, index: number): string | string[] {
            if (period === 'daily') {
              const label = processedData.labels[index];
              return Array.isArray(label) ? label : label;
            } else if (period === 'weekly' && processedData.monthLabels) {
              const label = processedData.labels[index];
              if (Array.isArray(label)) {
                return label;
              }
              return label;
            } else if (period === 'monthly' && processedData.yearLabels) {
              const baseDate = new Date();
              const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - 11 + index);
              const year = date.getFullYear().toString();
              if (processedData.yearLabels[year] === index) {
                const label = this.getLabelForValue(value);
                return [`${label}`, `${year}년`];
              }
            }
            return this.getLabelForValue(value);
          },
          maxRotation: 0,
          minRotation: 0,
          padding: 10,
        },
      },
      y: { beginAtZero: true },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    hover: {
      mode: 'index' as const,
      intersect: false,
      animationDuration: 0,
    },
  };

  const buttonStyle = 'px-4 py-2 text-sm font-medium rounded-md transition-colors';
  const activeButtonStyle = 'bg-teal-500 text-white';
  const inactiveButtonStyle = 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[today.getDay()];
    return `${year}.${month}.${day} ${dayOfWeek}`;
  };

  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-medium text-gray-700">{getTodayDate()}</div>
        <div className="flex space-x-6">
          <div className="space-x-2">
            <button className={`${buttonStyle} ${period === 'daily' ? activeButtonStyle : inactiveButtonStyle}`} onClick={() => setPeriod('daily')}>
              일간
            </button>
            <button className={`${buttonStyle} ${period === 'weekly' ? activeButtonStyle : inactiveButtonStyle}`} onClick={() => setPeriod('weekly')}>
              주간
            </button>
            <button className={`${buttonStyle} ${period === 'monthly' ? activeButtonStyle : inactiveButtonStyle}`} onClick={() => setPeriod('monthly')}>
              월간
            </button>
          </div>
          <div className="space-x-2">
            <button className={`${buttonStyle} ${statType === 'views' ? activeButtonStyle : inactiveButtonStyle}`} onClick={() => setStatType('views')}>
              조회수
            </button>
            <button className={`${buttonStyle} ${statType === 'visitors' ? activeButtonStyle : inactiveButtonStyle}`} onClick={() => setStatType('visitors')}>
              방문자수
            </button>
          </div>
        </div>
      </div>
      <div className="h-[calc(100%-3rem)]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
