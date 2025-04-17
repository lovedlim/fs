'use client';

import { formatAmount } from '@/lib/utils/financialUtils';

interface FinancialDetailsProps {
  balanceSheet: any;
  incomeStatement: any;
  ratios: any;
}

export default function FinancialDetails({ balanceSheet, incomeStatement, ratios }: FinancialDetailsProps) {
  // 데이터가 유효한지 확인
  if (!balanceSheet?.rawData || !incomeStatement?.rawData || !ratios?.data) {
    return (
      <div className="mt-12 mb-10 flex justify-center items-center p-8 bg-white rounded-lg shadow">
        <p className="text-gray-500">재무제표 데이터가 유효하지 않습니다</p>
      </div>
    );
  }
  
  const bs = balanceSheet.rawData;
  const is = incomeStatement.rawData;
  
  // 계정과목별 전년대비 증감률 계산
  const calculateGrowthRate = (current: number, previous: number): string => {
    if (previous === 0) return 'N/A';
    const rate = ((current - previous) / previous * 100).toFixed(2);
    return rate;
  };
  
  return (
    <div className="mt-12 mb-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">재미있는 재무제표 (재재)</h2>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">
          재무상태표
          {bs.isConsolidated && 
            <span className="ml-2 text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">연결</span>
          }
        </h3>
        <p className="text-sm text-gray-600 mb-5">{bs.years.current} | 단위: 원</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">과목</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">{bs.years.current}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">{bs.years.previous}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">증감률</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="bg-blue-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">자산총계</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatAmount(bs.assets.rawTotal)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {balanceSheet.chartData.datasets[1].data[0] ? 
                    formatAmount(String(balanceSheet.chartData.datasets[1].data[0] * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  parseFloat(calculateGrowthRate(bs.assets.total, balanceSheet.chartData.datasets[1].data[0])) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(bs.assets.total, balanceSheet.chartData.datasets[1].data[0]) === 'N/A' ? 
                   'N/A' : 
                   parseFloat(calculateGrowthRate(bs.assets.total, balanceSheet.chartData.datasets[1].data[0])) >= 0 ? 
                   '+' + calculateGrowthRate(bs.assets.total, balanceSheet.chartData.datasets[1].data[0]) + '%' : 
                   calculateGrowthRate(bs.assets.total, balanceSheet.chartData.datasets[1].data[0]) + '%'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 pl-8">유동자산</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(bs.assets.rawCurrent)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {bs.assets.prevRawCurrent !== '0' ? formatAmount(bs.assets.prevRawCurrent) : 'N/A'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  bs.assets.prevCurrent > 0 && parseFloat(calculateGrowthRate(bs.assets.current, bs.assets.prevCurrent)) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {bs.assets.prevCurrent > 0 ? 
                    (parseFloat(calculateGrowthRate(bs.assets.current, bs.assets.prevCurrent)) >= 0 ? 
                      '+' + calculateGrowthRate(bs.assets.current, bs.assets.prevCurrent) + '%' : 
                      calculateGrowthRate(bs.assets.current, bs.assets.prevCurrent) + '%') 
                    : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 pl-8">비유동자산</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(bs.assets.rawNonCurrent)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {bs.assets.prevRawNonCurrent !== '0' ? formatAmount(bs.assets.prevRawNonCurrent) : 'N/A'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  bs.assets.prevNonCurrent > 0 && parseFloat(calculateGrowthRate(bs.assets.nonCurrent, bs.assets.prevNonCurrent)) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {bs.assets.prevNonCurrent > 0 ? 
                    (parseFloat(calculateGrowthRate(bs.assets.nonCurrent, bs.assets.prevNonCurrent)) >= 0 ? 
                      '+' + calculateGrowthRate(bs.assets.nonCurrent, bs.assets.prevNonCurrent) + '%' : 
                      calculateGrowthRate(bs.assets.nonCurrent, bs.assets.prevNonCurrent) + '%')
                    : 'N/A'}
                </td>
              </tr>
              <tr className="bg-red-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">부채총계</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatAmount(bs.liabilities.rawTotal)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {balanceSheet.chartData.datasets[1].data[1] ? 
                    formatAmount(String(balanceSheet.chartData.datasets[1].data[1] * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  parseFloat(calculateGrowthRate(bs.liabilities.total, balanceSheet.chartData.datasets[1].data[1])) >= 0 ? 
                  'text-red-600' : 'text-green-600'
                }`}>
                  {calculateGrowthRate(bs.liabilities.total, balanceSheet.chartData.datasets[1].data[1]) === 'N/A' ? 
                   'N/A' : 
                   parseFloat(calculateGrowthRate(bs.liabilities.total, balanceSheet.chartData.datasets[1].data[1])) >= 0 ? 
                   '+' + calculateGrowthRate(bs.liabilities.total, balanceSheet.chartData.datasets[1].data[1]) + '%' : 
                   calculateGrowthRate(bs.liabilities.total, balanceSheet.chartData.datasets[1].data[1]) + '%'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 pl-8">유동부채</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(bs.liabilities.rawCurrent)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {bs.liabilities.prevRawCurrent !== '0' ? formatAmount(bs.liabilities.prevRawCurrent) : 'N/A'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  bs.liabilities.prevCurrent > 0 && parseFloat(calculateGrowthRate(bs.liabilities.current, bs.liabilities.prevCurrent)) >= 0 ? 
                  'text-red-600' : 'text-green-600'
                }`}>
                  {bs.liabilities.prevCurrent > 0 ? 
                    (parseFloat(calculateGrowthRate(bs.liabilities.current, bs.liabilities.prevCurrent)) >= 0 ? 
                      '+' + calculateGrowthRate(bs.liabilities.current, bs.liabilities.prevCurrent) + '%' : 
                      calculateGrowthRate(bs.liabilities.current, bs.liabilities.prevCurrent) + '%')
                    : 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 pl-8">비유동부채</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(bs.liabilities.rawNonCurrent)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {bs.liabilities.prevRawNonCurrent !== '0' ? formatAmount(bs.liabilities.prevRawNonCurrent) : 'N/A'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  bs.liabilities.prevNonCurrent > 0 && parseFloat(calculateGrowthRate(bs.liabilities.nonCurrent, bs.liabilities.prevNonCurrent)) >= 0 ? 
                  'text-red-600' : 'text-green-600'
                }`}>
                  {bs.liabilities.prevNonCurrent > 0 ? 
                    (parseFloat(calculateGrowthRate(bs.liabilities.nonCurrent, bs.liabilities.prevNonCurrent)) >= 0 ? 
                      '+' + calculateGrowthRate(bs.liabilities.nonCurrent, bs.liabilities.prevNonCurrent) + '%' : 
                      calculateGrowthRate(bs.liabilities.nonCurrent, bs.liabilities.prevNonCurrent) + '%')
                    : 'N/A'}
                </td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">자본총계</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatAmount(bs.equity.rawTotal)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {balanceSheet.chartData.datasets[1].data[2] ? 
                    formatAmount(String(balanceSheet.chartData.datasets[1].data[2] * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  parseFloat(calculateGrowthRate(bs.equity.total, balanceSheet.chartData.datasets[1].data[2])) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(bs.equity.total, balanceSheet.chartData.datasets[1].data[2]) === 'N/A' ? 
                   'N/A' : 
                   parseFloat(calculateGrowthRate(bs.equity.total, balanceSheet.chartData.datasets[1].data[2])) >= 0 ? 
                   '+' + calculateGrowthRate(bs.equity.total, balanceSheet.chartData.datasets[1].data[2]) + '%' : 
                   calculateGrowthRate(bs.equity.total, balanceSheet.chartData.datasets[1].data[2]) + '%'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">손익계산서</h3>
        <p className="text-sm text-gray-600 mb-5">{is.years.currentPeriod} | 단위: 원</p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">과목</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">{is.years.current}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">{is.years.previous}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">증감률</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">매출액</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatAmount(is.rawRevenue)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {incomeStatement.chartData.datasets[1].data[0] ? 
                    formatAmount(String(incomeStatement.chartData.datasets[1].data[0] * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  parseFloat(calculateGrowthRate(is.revenue, incomeStatement.chartData.datasets[1].data[0])) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(is.revenue, incomeStatement.chartData.datasets[1].data[0]) === 'N/A' ? 
                   'N/A' : 
                   parseFloat(calculateGrowthRate(is.revenue, incomeStatement.chartData.datasets[1].data[0])) >= 0 ? 
                   '+' + calculateGrowthRate(is.revenue, incomeStatement.chartData.datasets[1].data[0]) + '%' : 
                   calculateGrowthRate(is.revenue, incomeStatement.chartData.datasets[1].data[0]) + '%'}
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">영업이익</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatAmount(is.rawOperatingProfit)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {incomeStatement.chartData.datasets[1].data[1] ? 
                    formatAmount(String(incomeStatement.chartData.datasets[1].data[1] * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  parseFloat(calculateGrowthRate(is.operatingProfit, incomeStatement.chartData.datasets[1].data[1])) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(is.operatingProfit, incomeStatement.chartData.datasets[1].data[1]) === 'N/A' ? 
                   'N/A' : 
                   parseFloat(calculateGrowthRate(is.operatingProfit, incomeStatement.chartData.datasets[1].data[1])) >= 0 ? 
                   '+' + calculateGrowthRate(is.operatingProfit, incomeStatement.chartData.datasets[1].data[1]) + '%' : 
                   calculateGrowthRate(is.operatingProfit, incomeStatement.chartData.datasets[1].data[1]) + '%'}
                </td>
              </tr>
              <tr className="bg-green-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">당기순이익</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatAmount(is.rawNetIncome)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {incomeStatement.chartData.datasets[1].data[2] ? 
                    formatAmount(String(incomeStatement.chartData.datasets[1].data[2] * 100000000)) : '0원'}
                </td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${
                  parseFloat(calculateGrowthRate(is.netIncome, incomeStatement.chartData.datasets[1].data[2])) >= 0 ? 
                  'text-green-600' : 'text-red-600'
                }`}>
                  {calculateGrowthRate(is.netIncome, incomeStatement.chartData.datasets[1].data[2]) === 'N/A' ? 
                   'N/A' : 
                   parseFloat(calculateGrowthRate(is.netIncome, incomeStatement.chartData.datasets[1].data[2])) >= 0 ? 
                   '+' + calculateGrowthRate(is.netIncome, incomeStatement.chartData.datasets[1].data[2]) + '%' : 
                   calculateGrowthRate(is.netIncome, incomeStatement.chartData.datasets[1].data[2]) + '%'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">주요 재무비율</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">유동비율</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.currentRatio !== 'N/A' ? ratios.data.currentRatio + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              유동자산 / 유동부채 × 100
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">부채비율</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.debtToEquityRatio !== 'N/A' ? ratios.data.debtToEquityRatio + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              부채총계 / 자본총계 × 100
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">자기자본비율</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.equityRatio !== 'N/A' ? ratios.data.equityRatio + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              자본총계 / 자산총계 × 100
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">매출액영업이익률</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.operatingProfitMargin !== 'N/A' ? ratios.data.operatingProfitMargin + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              영업이익 / 매출액 × 100
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">매출액순이익률</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.netProfitMargin !== 'N/A' ? ratios.data.netProfitMargin + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              당기순이익 / 매출액 × 100
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">ROE (자기자본이익률)</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.returnOnEquity !== 'N/A' ? ratios.data.returnOnEquity + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              당기순이익 / 자본총계 × 100
            </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="text-sm text-gray-500 mb-1">ROA (총자산이익률)</div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {ratios.data.returnOnAssets !== 'N/A' ? ratios.data.returnOnAssets + '%' : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              당기순이익 / 자산총계 × 100
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 