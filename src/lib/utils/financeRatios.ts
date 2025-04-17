import { BalanceSheet, IncomeStatement, Ratios } from '@/types/financial';

// 재무비율 계산 함수
export function calculateFinancialRatios(
  balanceSheet: BalanceSheet, 
  incomeStatement: IncomeStatement
): Ratios {
  const bs = balanceSheet.rawData;
  const is = incomeStatement.rawData;
  
  // 분모가 0인 경우 'N/A' 반환하는 헬퍼 함수
  const calculateRatio = (numerator: number, denominator: number): string => {
    if (denominator === 0) return 'N/A';
    return ((numerator / denominator) * 100).toFixed(2);
  };
  
  // 성장률 계산 함수
  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  // 주요 재무비율 계산
  const currentRatio = calculateRatio(bs.assets.current, bs.liabilities.current); // 유동비율
  const debtToEquityRatio = calculateRatio(bs.liabilities.total, bs.equity.total); // 부채비율
  const equityRatio = calculateRatio(bs.equity.total, bs.assets.total); // 자기자본비율
  const operatingProfitMargin = calculateRatio(is.operatingProfit, is.revenue); // 영업이익률
  const netProfitMargin = calculateRatio(is.netIncome, is.revenue); // 순이익률
  const returnOnEquity = calculateRatio(is.netIncome, bs.equity.total); // ROE
  const returnOnAssets = calculateRatio(is.netIncome, bs.assets.total); // ROA
  
  // 성장률 계산
  const assetGrowth = calculateGrowthRate(bs.assets.total, bs.assets.prevTotal);
  const revenueGrowth = calculateGrowthRate(is.revenue, incomeStatement.chartData.datasets[1].data[0]);
  const operatingProfitGrowth = calculateGrowthRate(is.operatingProfit, incomeStatement.chartData.datasets[1].data[1]);
  const netIncomeGrowth = calculateGrowthRate(is.netIncome, incomeStatement.chartData.datasets[1].data[2]);

  return {
    data: {
      currentRatio,
      debtToEquityRatio,
      equityRatio,
      operatingProfitMargin,
      netProfitMargin,
      returnOnEquity,
      returnOnAssets,
      assetGrowth,
      revenueGrowth,
      operatingProfitGrowth,
      netIncomeGrowth
    }
  };
} 