'use client';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  ChartData,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Bar, Pie, Line, Radar } from 'react-chartjs-2';
import { formatAmount } from '@/lib/utils/financialUtils';
import { BalanceSheet, IncomeStatement, FinancialRatios } from '@/types/financial';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale
);

// Define more specific chart types
type ChartType = 'bar' | 'pie' | 'line' | 'radar';

interface ChartComponentProps { 
  // Disable any rule for complex Chart.js types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: ChartData<any, number[], any>; 
  title: string;
  type: 'bar' | 'pie' | 'line' | 'radar';
  height?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: ChartOptions<any>;
}

const ChartComponent = ({ data, title, type, height = 300, options = {} }: ChartComponentProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const defaultOptions: ChartOptions<any> = { 
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: function(context: TooltipItem<any>) { 
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.formattedValue) {
              label += context.formattedValue;
              // Use context.chart.options.plugins?.title?.text
              const chartTitle = context.chart.options.plugins?.title?.text?.toString();
              if (chartTitle?.includes('억원')) { 
                label += ' 억원';
              } else if (chartTitle?.includes('%')) {
                label += '%';
              }
            } 
            return label;
          }
        }
      }
    },
  };

  // Simple merge, specific scales should be provided via options prop where needed
  const mergedOptions = { ...defaultOptions, ...options }; 
  
  // 데이터가 없거나, labels가 없는 경우 빈 화면 표시
  if (!data || !data.labels || !data.datasets) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center">
        <p className="text-gray-500">차트 데이터가 유효하지 않습니다</p>
      </div>
    );
  }
  
  return (
    <div style={{ height: `${height}px` }}>
      {type === 'bar' && <Bar options={mergedOptions} data={data} />}
      {type === 'pie' && <Pie options={mergedOptions} data={data} />}
      {type === 'line' && <Line options={mergedOptions} data={data} />}
      {type === 'radar' && <Radar options={mergedOptions} data={data} />}
    </div>
  );
};

interface FinancialChartsProps {
  balanceSheet: BalanceSheet | null;
  incomeStatement: IncomeStatement | null;
  ratios: FinancialRatios | null;
}

export default function FinancialCharts({ balanceSheet, incomeStatement, ratios }: FinancialChartsProps) {
  // Add a guard clause to ensure all necessary props are available
  if (!balanceSheet || !incomeStatement || !ratios) {
    return (
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">재무제표 분석</h2>
        <p className="text-center text-gray-500">차트를 표시하기 위한 데이터가 부족합니다.</p>
      </div>
    );
  }

  // Now we know props are not null, remove optional chaining where appropriate
  const bs = balanceSheet.rawData; 
  const is = incomeStatement.rawData;
  const ratioData = ratios.data; // Access ratios.data directly
  const ratioChartData = ratios.chartData; // Access ratios.chartData directly
  
  // 디버깅용 로그 - Can keep or remove
  console.log("*** 데이터 디버깅 ***");
  console.log("balanceSheet:", balanceSheet);
  console.log("incomeStatement:", incomeStatement);
  console.log("ratios:", JSON.stringify(ratios, null, 2));
  console.log("매출액:", is.rawRevenue, is.revenue);
  console.log("영업이익:", is.rawOperatingProfit, is.operatingProfit);
  console.log("당기순이익:", is.rawNetIncome, is.netIncome);
  console.log("*******************");
  
  // 자산 구조 데이터 생성 (bs is guaranteed to be non-null here)
  const assetStructure = {
    labels: ['유동자산', '비유동자산'],
    datasets: [
      {
        label: bs.years.current, // No need for ?. 
        data: [
          bs.assets.current, // No need for ?. 
          bs.assets.nonCurrent // No need for ?. 
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // 부채 및 자본 구조 데이터 생성 (bs is guaranteed to be non-null)
  const liabEquityStructure = {
    labels: ['부채총계', '자본총계'],
    datasets: [
      {
        label: bs.years.current,
        data: [
          bs.liabilities.total, // No need for ?. 
          bs.equity.total // No need for ?. 
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // 수익성 지표 데이터 생성 (is and incomeStatement are guaranteed to be non-null)
  const profitMarginData = {
    labels: ['영업이익률', '순이익률'],
    datasets: [
      {
        label: is.years.current,
        data: [
          is.revenue > 0 ? (is.operatingProfit / is.revenue * 100) : 0,
          is.revenue > 0 ? (is.netIncome / is.revenue * 100) : 0
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        tension: 0.1
      },
      {
        label: is.years.previous,
        data: [
          incomeStatement.chartData.datasets[1].data[1] && incomeStatement.chartData.datasets[1].data[0] > 0 ?
            (incomeStatement.chartData.datasets[1].data[1] / incomeStatement.chartData.datasets[1].data[0] * 100) : 0,
          incomeStatement.chartData.datasets[1].data[2] && incomeStatement.chartData.datasets[1].data[0] > 0 ?
            (incomeStatement.chartData.datasets[1].data[2] / incomeStatement.chartData.datasets[1].data[0] * 100) : 0
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        tension: 0.1
      }
    ]
  };

  // 재무 지표 레이더 차트 데이터 (ratioData is guaranteed to be non-null)
  const financialHealthData = {
    labels: ['유동비율', '부채비율', '자기자본비율', '영업이익률', '순이익률', 'ROE', 'ROA'],
    datasets: [
      {
        label: bs.years.current,
        data: [
          ratioData.currentRatio !== 'N/A' ? parseFloat(ratioData.currentRatio) : 0,
          ratioData.debtToEquityRatio !== 'N/A' ? parseFloat(ratioData.debtToEquityRatio) : 0,
          ratioData.equityRatio !== 'N/A' ? parseFloat(ratioData.equityRatio) : 0,
          ratioData.operatingProfitMargin !== 'N/A' ? parseFloat(ratioData.operatingProfitMargin) : 0,
          ratioData.netProfitMargin !== 'N/A' ? parseFloat(ratioData.netProfitMargin) : 0,
          ratioData.returnOnEquity !== 'N/A' ? parseFloat(ratioData.returnOnEquity) : 0,
          ratioData.returnOnAssets !== 'N/A' ? parseFloat(ratioData.returnOnAssets) : 0
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  };

  // 연간 성장률 계산 (is and incomeStatement are guaranteed to be non-null)
  const calculateGrowthRate = (current: number, previous: number): string => {
    if (previous === 0) return 'N/A';
    return ((current - previous) / Math.abs(previous) * 100).toFixed(2); // Use Math.abs for previous
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">재무제표 분석</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">재무상태표 (억원)</h3>
            <div className="text-sm text-gray-500">
              {bs.years.current || '-'}
            </div>
          </div>
          <ChartComponent 
            data={balanceSheet?.chartData || { labels: [], datasets: [] }} 
            title="재무상태표 (억원)" 
            type="bar"
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '억원'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">손익계산서 (억원)</h3>
            <div className="text-sm text-gray-500">
              {is.years?.currentPeriod || '-'}
            </div>
          </div>
          <ChartComponent 
            data={incomeStatement?.chartData || { labels: [], datasets: [] }} 
            title="손익계산서 (억원)" 
            type="bar" 
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '억원'
                  }
                }
              }
            }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">자산 구조</h3>
            <div className="text-sm text-gray-500">
              {formatAmount(bs.assets?.rawTotal || '0')}
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2 text-center">
            유동자산: {formatAmount(bs.assets?.rawCurrent || '0')} ({bs.assets?.total ? ((bs.assets.current || 0) / bs.assets.total * 100).toFixed(1) : '0'}%) | 
            비유동자산: {formatAmount(bs.assets?.rawNonCurrent || '0')} ({bs.assets?.total ? ((bs.assets.nonCurrent || 0) / bs.assets.total * 100).toFixed(1) : '0'}%)
          </div>
          <ChartComponent 
            data={assetStructure || { labels: [], datasets: [] }} 
            title="자산 구조 (억원)" 
            type="pie" 
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-700">부채 및 자본 구조</h3>
            <div className="text-sm text-gray-500">
              {formatAmount(bs.assets?.rawTotal || '0')}
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2 text-center">
            부채총계: {formatAmount(bs.liabilities?.rawTotal || '0')} ({bs.assets?.total ? ((bs.liabilities?.total || 0) / bs.assets.total * 100).toFixed(1) : '0'}%) | 
            자본총계: {formatAmount(bs.equity?.rawTotal || '0')} ({bs.assets?.total ? ((bs.equity?.total || 0) / bs.assets.total * 100).toFixed(1) : '0'}%)
          </div>
          <ChartComponent 
            data={liabEquityStructure || { labels: [], datasets: [] }} 
            title="부채 및 자본 구조 (억원)" 
            type="pie" 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">수익성 지표</h3>
            <div className="text-sm text-gray-500">
              3개년 추이
            </div>
          </div>
          <ChartComponent 
            data={profitMarginData || { labels: [], datasets: [] }} 
            title="매출액 대비 이익률 (%)" 
            type="line" 
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '%'
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">재무 건전성</h3>
            <div className="text-sm text-gray-500">
              {bs.years.current || '-'}
            </div>
          </div>
          <ChartComponent 
            data={financialHealthData || { labels: [], datasets: [] }} 
            title="재무 건전성 지표" 
            type="radar" 
            options={{
              scales: {
                r: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 20
                  }
                }
              }
            }}
          />
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">주요 재무 비율</h3>
          <div className="text-sm text-gray-500">
            {bs.years.current || '-'}
          </div>
        </div>
        <ChartComponent 
          data={ratioChartData} // Use ratioChartData directly
          title="재무 비율 (%)" 
          type="bar" 
          height={250}
          options={{
            scales: {
              y: {
                beginAtZero: true 
              },
              x: { 
                beginAtZero: true,
                title: {
                  display: true,
                  text: '%'
                }
              }
            },
            indexAxis: 'y' as const
          }}
        />
      </div>

      {/* 재무 성장성 지표 */}
      <div className="bg-white p-6 rounded-lg shadow mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">재무 성장성 지표</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">항목</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {is.years?.current || '-'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {is.years?.previous || '-'}
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전년대비 성장률
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">매출액</td>
                <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                  {formatAmount(is.rawRevenue || '0')}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {incomeStatement?.chartData?.datasets?.[1]?.data?.[0] ? 
                    formatAmount(String((incomeStatement.chartData.datasets[1].data[0] || 0) * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  calculateGrowthRate(is.revenue || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[0] || 0) === 'N/A' ? 
                  'text-gray-500' : 
                  parseFloat(calculateGrowthRate(is.revenue || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[0] || 0)) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(is.revenue || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[0] || 0) === 'N/A' ? 
                    'N/A' : 
                    parseFloat(calculateGrowthRate(is.revenue || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[0] || 0)) >= 0 ? 
                    '+' + calculateGrowthRate(is.revenue || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[0] || 0) + '%' : 
                    calculateGrowthRate(is.revenue || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[0] || 0) + '%'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">영업이익</td>
                <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                  {formatAmount(is.rawOperatingProfit || '0')}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {incomeStatement?.chartData?.datasets?.[1]?.data?.[1] ? 
                    formatAmount(String((incomeStatement.chartData.datasets[1].data[1] || 0) * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  calculateGrowthRate(is.operatingProfit || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[1] || 0) === 'N/A' ? 
                  'text-gray-500' : 
                  parseFloat(calculateGrowthRate(is.operatingProfit || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[1] || 0)) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(is.operatingProfit || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[1] || 0) === 'N/A' ? 
                    'N/A' : 
                    parseFloat(calculateGrowthRate(is.operatingProfit || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[1] || 0)) >= 0 ? 
                    '+' + calculateGrowthRate(is.operatingProfit || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[1] || 0) + '%' : 
                    calculateGrowthRate(is.operatingProfit || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[1] || 0) + '%'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">당기순이익</td>
                <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                  {formatAmount(is.rawNetIncome || '0')}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {incomeStatement?.chartData?.datasets?.[1]?.data?.[2] ? 
                    formatAmount(String((incomeStatement.chartData.datasets[1].data[2] || 0) * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  calculateGrowthRate(is.netIncome || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[2] || 0) === 'N/A' ? 
                  'text-gray-500' : 
                  parseFloat(calculateGrowthRate(is.netIncome || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[2] || 0)) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(is.netIncome || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[2] || 0) === 'N/A' ? 
                    'N/A' : 
                    parseFloat(calculateGrowthRate(is.netIncome || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[2] || 0)) >= 0 ? 
                    '+' + calculateGrowthRate(is.netIncome || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[2] || 0) + '%' : 
                    calculateGrowthRate(is.netIncome || 0, incomeStatement?.chartData?.datasets?.[1]?.data?.[2] || 0) + '%'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">총자산</td>
                <td className="px-4 py-3 text-sm text-right text-gray-800 font-semibold">
                  {formatAmount(bs.assets?.rawTotal || '0')}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {balanceSheet?.chartData?.datasets?.[1]?.data?.[0] ? 
                    formatAmount(String((balanceSheet.chartData.datasets[1].data[0] || 0) * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  calculateGrowthRate(bs.assets?.total || 0, balanceSheet?.chartData?.datasets?.[1]?.data?.[0] || 0) === 'N/A' ? 
                  'text-gray-500' : 
                  parseFloat(calculateGrowthRate(bs.assets?.total || 0, balanceSheet?.chartData?.datasets?.[1]?.data?.[0] || 0)) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(bs.assets?.total || 0, balanceSheet?.chartData?.datasets?.[1]?.data?.[0] || 0) === 'N/A' ? 
                    'N/A' : 
                    parseFloat(calculateGrowthRate(bs.assets?.total || 0, balanceSheet?.chartData?.datasets?.[1]?.data?.[0] || 0)) >= 0 ? 
                    '+' + calculateGrowthRate(bs.assets?.total || 0, balanceSheet?.chartData?.datasets?.[1]?.data?.[0] || 0) + '%' : 
                    calculateGrowthRate(bs.assets?.total || 0, balanceSheet?.chartData?.datasets?.[1]?.data?.[0] || 0) + '%'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 