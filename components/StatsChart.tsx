'use client';

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';

// Register chart components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, crosshairPlugin);

// Dynamic import for zoom plugin
if (typeof window !== 'undefined') {
  import('chartjs-plugin-zoom').then((zoomPlugin) => {
    ChartJS.register(zoomPlugin.default);
  });
}

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
  const [timeOffset, setTimeOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStatsData(data.data);
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

  // 시간 이동 함수
  const moveTime = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setTimeOffset(prev => prev + 1);
    } else {
      setTimeOffset(prev => Math.max(0, prev - 1));
    }
  };

  // 현재 기간에 따른 이동 단위 텍스트
  const getMoveUnitText = () => {
    switch (period) {
      case 'daily':
        return '30일';
      case 'weekly':
        return '15주';
      case 'monthly':
        return '12개월';
    }
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
      today.setDate(today.getDate() - (timeOffset * 30)); // 30일 단위로 이동
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
        const date = new Date(curr.date);
        const weekKey = formatDate(date);
        if (!acc[weekKey]) {
          acc[weekKey] = { views: 0, visitors: 0 };
        }
        acc[weekKey].views += curr.views;
        acc[weekKey].visitors += curr.visitors;
        return acc;
      }, {});

      // 기준 날짜 설정 (timeOffset 고려)
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - (timeOffset * 105)); // 15주 단위로 이동 (15 * 7 = 105일)

      // 날짜 배열 생성
      const weekDates = Array.from({ length: 15 }, (_, i) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + (i * 7));
        return formatDate(date);
      });

      // 월이 바뀌는 지점 찾기
      const monthLabels = Array.from({ length: 15 }, (_, i) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + (i * 7));
        const month = date.getMonth() + 1;
        return { month, index: i };
      }).reduce((acc: { [key: string]: number }, { month, index }) => {
        if (!acc[month]) {
          acc[month] = index;
        }
        return acc;
      }, {});

      // 날짜를 순차적으로 표시하기 위한 배열 생성
      const sequentialDates = Array.from({ length: 15 }, (_, i) => {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + (i * 7));
        return {
          day: date.getDate().toString(),
          month: date.getMonth() + 1
        };
      });

      return {
        labels: sequentialDates.map(({ day, month }, index) => {
          if (monthLabels[month] === index) {
            return [`${day}`, `${month}월`];
          }
          return day;
        }),
        data: weekDates.map(date => weeklyData[date]?.[statType] || 0),
        monthLabels,
      };
    } else {
      // 최근 12개월 데이터
      const monthlyData = statsData.reduce((acc: { [key: string]: { views: number; visitors: number } }, curr) => {
        const date = new Date(curr.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!acc[monthKey]) {
          acc[monthKey] = { views: 0, visitors: 0 };
        }
        acc[monthKey].views += curr.views;
        acc[monthKey].visitors += curr.visitors;
        return acc;
      }, {});

      // 기준 날짜 설정 (timeOffset 고려)
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - (timeOffset * 12)); // 12개월 단위로 이동

      // 월별 데이터 배열 생성
      const monthDates = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + i);
        return {
          key: `${date.getFullYear()}-${date.getMonth() + 1}`,
          label: `${date.getMonth() + 1}월`,
          year: date.getFullYear()
        };
      });

      // 연도가 바뀌는 지점 찾기
      const yearLabels = monthDates.reduce((acc: { [key: string]: number }, { year }, index) => {
        if (!acc[year]) {
          acc[year] = index;
        }
        return acc;
      }, {});

      return {
        labels: monthDates.map(({ label, year }, index) => {
          if (yearLabels[year] === index) {
            return [label, `${year}년`];
          }
          return label;
        }),
        data: monthDates.map(({ key }) => monthlyData[key]?.[statType] || 0),
        yearLabels,
      };
    }
  };

  const processedData = processDataByPeriod();

  // 한 칸의 너비 계산
  const blockWidth = 30; // 기본 블록 너비
  const totalBlocks = processedData.labels.length;
  const chartWidth = `calc(100% - ${blockWidth}px)`; // 차트 전체 너비

  const chartData = {
    labels: processedData.labels.map(() => ""),
    datasets: [
      {
        data: processedData.data,
        backgroundColor: processedData.data.map((_, index) => 
          index === hoveredIndex ? 'rgba(75, 192, 192, 0.8)' : 'rgba(75, 192, 192, 0.6)'
        ),
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        pointRadius: processedData.data.map((_, index) => 
          index === hoveredIndex ? 7 : 5
        ),
        pointBackgroundColor: processedData.data.map((_, index) => 
          index === hoveredIndex ? 'rgba(75, 192, 192, 1)' : 'rgba(75, 192, 192, 1)'
        ),
        pointBorderColor: '#fff',
        pointBorderWidth: processedData.data.map((_, index) => 
          index === hoveredIndex ? 3 : 2
        ),
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
        },
        ticks: {
          display: false,
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

  const handleTimeBlockHover = (index: number | null) => {
    setHoveredIndex(index);
    
    if (chartRef.current && index !== null) {
      const chart = chartRef.current;
      
      // 차트의 getDatasetMeta를 사용하여 데이터 포인트의 위치 정보를 가져옵니다
      const meta = chart.getDatasetMeta(0);
      if (meta.data[index]) {
        const element = meta.data[index];
        chart.setActiveElements([{
          datasetIndex: 0,
          index: index,
          element: element
        }]);
        
        chart.tooltip.setActiveElements([{
          datasetIndex: 0,
          index: index,
        }], {
          x: element.x,
          y: element.y
        });
      }
      
      chart.update('none'); // 'none' 모드로 업데이트하여 성능 최적화
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-4 mb-4">
        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value as PeriodType);
            setTimeOffset(0);
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="daily">일간</option>
          <option value="weekly">주간</option>
          <option value="monthly">월간</option>
        </select>
        <select
          value={statType}
          onChange={(e) => setStatType(e.target.value as StatType)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="views">조회수</option>
          <option value="visitors">방문자</option>
        </select>
      </div>
      <div className="relative w-full">
        <div className="w-full h-[400px]" style={{ width: chartWidth }}>
          <Line
            ref={chartRef}
            data={chartData}
            options={options}
          />
        </div>
        <div className="w-full mt-4">
          <div className="flex items-center">
            <button
              onClick={() => moveTime('prev')}
              className="py-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 grid" style={{ 
              gridTemplateColumns: `repeat(${totalBlocks}, minmax(${blockWidth}px, 1fr))`,
              width: chartWidth,
              columnGap: '0'
            }}>
              {processedData.labels.map((label, index) => {
                const displayLabel = Array.isArray(label) ? label[0] : label;
                const monthLabel = Array.isArray(label) ? label[1] : null;
                
                return (
                  <div 
                    key={index} 
                    className={`flex flex-col items-center cursor-pointer transition-colors ${
                      hoveredIndex === index ? 'bg-gray-50' : ''
                    }`}
                    onMouseEnter={() => handleTimeBlockHover(index)}
                    onMouseLeave={() => handleTimeBlockHover(null)}
                  >
                    <span className="text-sm text-gray-600">{displayLabel}</span>
                    {monthLabel && (
                      <span className="text-sm font-medium text-gray-800 mt-1">{monthLabel}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => moveTime('next')}
              disabled={timeOffset === 0}
              className={`py-2 rounded-full transition-colors ${
                timeOffset === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {timeOffset > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          {getMoveUnitText()} 전 데이터
        </div>
      )}
    </div>
  );
} 