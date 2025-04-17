export interface BalanceSheet {
  rawData: {
    years: {
      current: string;
      previous: string;
    };
    isConsolidated: boolean;
    assets: {
      rawCurrent: string;
      rawNonCurrent: string;
      rawTotal: string;
      prevRawCurrent: string;
      prevRawNonCurrent: string;
      prevRawTotal: string;
      current: number;
      nonCurrent: number;
      total: number;
      prevCurrent: number;
      prevNonCurrent: number;
      prevTotal: number;
    };
    liabilities: {
      rawCurrent: string;
      rawNonCurrent: string;
      rawTotal: string;
      prevRawCurrent: string;
      prevRawNonCurrent: string;
      prevRawTotal: string;
      current: number;
      nonCurrent: number;
      total: number;
      prevCurrent: number;
      prevNonCurrent: number;
      prevTotal: number;
    };
    equity: {
      rawTotal: string;
      prevRawTotal: string;
      total: number;
      prevTotal: number;
    };
  };
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
}

export interface IncomeStatement {
  rawData: {
    years: {
      current: string;
      previous: string;
      currentPeriod: string;
    };
    rawRevenue: string;
    rawOperatingProfit: string;
    rawNetIncome: string;
    revenue: number;
    operatingProfit: number;
    netIncome: number;
  };
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
}

export interface FinancialRatios {
  data: {
    currentRatio: string;
    debtToEquityRatio: string;
    equityRatio: string;
    operatingProfitMargin: string;
    netProfitMargin: string;
    returnOnEquity: string;
    returnOnAssets: string;
  };
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
} 