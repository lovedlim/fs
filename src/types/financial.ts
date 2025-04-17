// src/types/financial.ts
// 재무제표 관련 공통 타입 정의

export interface FinancialData {
  balanceSheet: BalanceSheet;
  incomeStatement: IncomeStatement;
  ratios: Ratios;
}

export interface BalanceSheet {
  rawData: BalanceSheetRawData;
  chartData: ChartData;
}

export interface BalanceSheetRawData {
  assets: {
    rawTotal: string;
    rawCurrent: string;
    rawNonCurrent: string;
    total: number;
    current: number;
    nonCurrent: number;
    prevTotal: number;
    prevCurrent: number;
    prevNonCurrent: number;
    prevRawCurrent: string;
    prevRawNonCurrent: string;
  };
  liabilities: {
    rawTotal: string;
    rawCurrent: string;
    rawNonCurrent: string;
    total: number;
    current: number;
    nonCurrent: number;
    prevTotal: number;
    prevCurrent: number;
    prevNonCurrent: number;
    prevRawCurrent: string;
    prevRawNonCurrent: string;
  };
  equity: {
    rawTotal: string;
    total: number;
    prevTotal: number;
  };
  years: {
    current: string;
    previous: string;
  };
  isConsolidated: boolean;
}

export interface IncomeStatement {
  rawData: IncomeStatementRawData;
  chartData: ChartData;
}

export interface IncomeStatementRawData {
  rawRevenue: string;
  rawOperatingProfit: string;
  rawNetIncome: string;
  revenue: number;
  operatingProfit: number;
  netIncome: number;
  years: {
    current: string;
    previous: string;
    currentPeriod: string;
  };
}

export interface Ratios {
  data: {
    currentRatio: string;
    debtToEquityRatio: string;
    equityRatio: string;
    operatingProfitMargin: string;
    netProfitMargin: string;
    returnOnEquity: string;
    returnOnAssets: string;
    assetGrowth: number;
    revenueGrowth: number;
    operatingProfitGrowth: number;
    netIncomeGrowth: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export interface Company {
  id: number;
  corp_code: string;
  corp_name: string;
  stock_code: string | null;
}

// API 에러 처리를 위한 타입
export interface ApiError {
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: string;
      };
    };
  };
  message?: string;
  request?: unknown;
  code?: string;
} 