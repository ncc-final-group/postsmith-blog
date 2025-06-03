'use client';

import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { useEffect, useState, useRef } from 'react';
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
  const [timeOffset, setTimeOffset] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<any>(null);

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

      const date = new Date();
      date.setDate(date.getDate() - (timeOffset * 105)); // 15주 단위로 이동 (15 * 7 = 105일)

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
      baseDate.setMonth(baseDate.getMonth() - (timeOffset * 12)); // 12개월 단위로 이동
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

  const handleTimeBlockHover = (index: number | null) => {
    setHoveredIndex(index);
    
    if (chartRef.current && index !== null) {
      const chart = chartRef.current;
      const tooltip = chart.tooltip;
      const datasetIndex = 0;

      if (tooltip) {
        if (index === null) {
          tooltip.setActiveElements([], { datasetIndex, index });
        } else {
          tooltip.setActiveElements([{ datasetIndex, index }], { datasetIndex, index });
        }
        chart.update();
      }
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
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  enabled: true,
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    title: (context) => {
                      const label = processedData.labels[context[0].dataIndex];
                      if (Array.isArray(label)) {
                        return `${label[0]} ${label[1]}`;
                      }
                      return label;
                    }
                  }
                }
              },
              layout: {
                padding: 10
              },
              scales: {
                x: {
                  grid: {
                    display: true,
                  },
                  ticks: {
                    display: false,
                  },
                  border: {
                    display: false,
                  }
                },
                y: {
                  beginAtZero: true,
                  border: {
                    display: false,
                  }
                },
              },
              hover: {
                mode: 'index',
                intersect: false
              },
            }}
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
                    className="flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors"
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
