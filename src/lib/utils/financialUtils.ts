// 재무제표 데이터 처리 유틸리티

import {
  BalanceSheet, IncomeStatement, FinancialRatios
} from '@/types/financial';

// Export the DartRawItem interface
export interface DartRawItem {
  account_nm: string;      // 계정명
  thstrm_dt?: string;       // 당기일자
  thstrm_amount?: string;   // 당기금액
  frmtrm_dt?: string;       // 전기일자
  frmtrm_amount?: string;   // 전기금액
  // Potentially add fs_div, fs_nm, sj_nm, account_detail here if needed
  fs_div?: string; // 재무제표 구분 (CFS/OFS)
  fs_nm?: string; // 재무제표명
  sj_nm?: string; // 계정명 (상세)
  account_detail?: string; // 계정상세
}

// Export the DartApiResponse interface
export interface DartApiResponse {
  list?: DartRawItem[];
  isConsolidated?: boolean;
  status?: string; // Include status and message if they are part of the structure
  message?: string;
}

// 단위 변환 (원 -> 억원/조원) 및 포맷팅
export function formatAmount(amount: string): string {
  try {
    // 콤마 제거
    const cleanAmount = amount.replace(/,/g, '');
    const numAmount = Number(cleanAmount);
    
    if (isNaN(numAmount)) {
      console.warn('formatAmount: 유효하지 않은 값:', amount);
      return '0원';
    }
    
    // 1조원 이상인 경우
    if (numAmount >= 1000000000000) {
      return (numAmount / 1000000000000).toFixed(2) + '조원';
    }
    // 1억원 이상인 경우
    else if (numAmount >= 100000000) {
      return (numAmount / 100000000).toFixed(2) + '억원';
    }
    // 1억원 미만인 경우
    else {
      return numAmount.toLocaleString() + '원';
    }
  } catch (error) {
    console.error('formatAmount 오류:', error, amount);
    return '0원';
  }
}

// 단위 변환 (원 -> 억원) 수치만 반환
export function convertToUnit(amount: string): number {
  try {
    // 빈 값이나 undefined 처리
    if (!amount || amount === 'undefined' || amount === 'null') {
      console.warn('convertToUnit: 빈 값 또는 정의되지 않은 값');
      return 0;
    }
    
    // 콤마 제거 후 숫자로 변환
    const cleanAmount = amount.replace(/,/g, '');
    const numAmount = Number(cleanAmount);
    
    if (isNaN(numAmount)) {
      console.warn('convertToUnit: 유효하지 않은 값:', amount);
      return 0;
    }
    
    return parseFloat((numAmount / 100000000).toFixed(2)); // 억원 단위로 변환하고 소수점 2자리까지 표시
  } catch (error) {
    console.error('convertToUnit 오류:', error, amount);
    return 0;
  }
}

// 재무상태표 데이터 가공
export function processBalanceSheet(data: DartApiResponse): BalanceSheet {
  try {
    const bsData: DartRawItem[] = data.list || [];
    
    // 디버깅: 계정명 확인
    console.log('계정 목록:', bsData.map((item: DartRawItem) => ({ 
      계정명: item.account_nm, 
      당기값: item.thstrm_amount, 
      전기값: item.frmtrm_amount 
    })));
    
    // Change let to const
    const currentAssets = bsData.find((item: DartRawItem) => 
      item.account_nm === '유동자산' || 
      item.account_nm.includes('유동자산') ||
      item.account_nm.includes('유동 자산')
    );
    const nonCurrentAssets = bsData.find((item: DartRawItem) => 
      item.account_nm === '비유동자산' || 
      item.account_nm.includes('비유동자산') ||
      item.account_nm.includes('비유동 자산') ||
      item.account_nm.includes('비유동성자산')
    );
    const totalAssets = bsData.find((item: DartRawItem) => 
      item.account_nm === '자산총계' || 
      item.account_nm.includes('자산총계') ||
      item.account_nm.includes('자산 총계') ||
      item.account_nm.includes('자산합계')
    );

    // Keep these as let as they might be reassigned by calculation
    let calculatedCurrentAssets = currentAssets; 
    let calculatedNonCurrentAssets = nonCurrentAssets;

    if (totalAssets && (!calculatedCurrentAssets || !calculatedNonCurrentAssets)) {
      // 총자산 값이 있지만 유동/비유동 자산이 없는 경우, 세부 항목 찾기 시도
      const currentAssetsItems = bsData.filter((item: DartRawItem) => 
        item.account_nm.includes('현금') || 
        item.account_nm.includes('단기') || 
        item.account_nm.includes('매출채권') ||
        item.account_nm.includes('재고자산')
      );
      
      const nonCurrentAssetsItems = bsData.filter((item: DartRawItem) => 
        item.account_nm.includes('장기') || 
        item.account_nm.includes('투자') || 
        item.account_nm.includes('유형자산') ||
        item.account_nm.includes('무형자산')
      );
      
      if (currentAssetsItems.length > 0) {
        // 유동자산 항목들의 합계 계산
        const currentAssetsSum = currentAssetsItems.reduce((sum: number, item: DartRawItem) => {
          const amount = Number(item.thstrm_amount?.replace(/,/g, '') || '0');
          return sum + amount;
        }, 0);
        
        calculatedCurrentAssets = {
          account_nm: '유동자산(계산됨)',
          thstrm_amount: currentAssetsSum.toString(),
          frmtrm_amount: '0'
        };
      }
      
      if (nonCurrentAssetsItems.length > 0) {
        // 비유동자산 항목들의 합계 계산
        const nonCurrentAssetsSum = nonCurrentAssetsItems.reduce((sum: number, item: DartRawItem) => {
          const amount = Number(item.thstrm_amount?.replace(/,/g, '') || '0');
          return sum + amount;
        }, 0);
        
        calculatedNonCurrentAssets = {
          account_nm: '비유동자산(계산됨)',
          thstrm_amount: nonCurrentAssetsSum.toString(),
          frmtrm_amount: '0'
        };
      }
    }

    // 자산 디버깅
    console.log('유동자산: ', calculatedCurrentAssets?.account_nm, calculatedCurrentAssets?.thstrm_amount);
    console.log('비유동자산: ', calculatedNonCurrentAssets?.account_nm, calculatedNonCurrentAssets?.thstrm_amount);
    console.log('총자산: ', totalAssets?.account_nm, totalAssets?.thstrm_amount);

    // 부채
    const currentLiabilities = bsData.find((item: DartRawItem) => 
      item.account_nm === '유동부채' || 
      item.account_nm.includes('유동부채') ||
      item.account_nm.includes('유동 부채')
    );
    const nonCurrentLiabilities = bsData.find((item: DartRawItem) => 
      item.account_nm.includes('비유동부채') || 
      item.account_nm.includes('비유동 부채') ||
      item.account_nm.includes('비유동성부채')
    );
    const totalLiabilities = bsData.find((item: DartRawItem) => 
      item.account_nm === '부채총계' || 
      item.account_nm.includes('부채총계') ||
      item.account_nm.includes('부채 총계') ||
      item.account_nm.includes('부채합계')
    );

    // Use let for variables that might be recalculated
    let calculatedCurrentLiabilities = currentLiabilities;
    let calculatedNonCurrentLiabilities = nonCurrentLiabilities;

    if (totalLiabilities && (!calculatedCurrentLiabilities || !calculatedNonCurrentLiabilities)) {
      // 총부채 값이 있지만 유동/비유동 부채가 없는 경우, 세부 항목 찾기 시도
      const currentLiabilitiesItems = bsData.filter((item: DartRawItem) => 
        item.account_nm.includes('단기') || 
        item.account_nm.includes('매입채무') || 
        item.account_nm.includes('미지급')
      );
      
      const nonCurrentLiabilitiesItems = bsData.filter((item: DartRawItem) => 
        item.account_nm.includes('장기') || 
        item.account_nm.includes('사채') || 
        item.account_nm.includes('충당부채')
      );
      
      if (currentLiabilitiesItems.length > 0) {
        // 유동부채 항목들의 합계 계산
        const currentLiabilitiesSum = currentLiabilitiesItems.reduce((sum: number, item: DartRawItem) => {
          const amount = Number(item.thstrm_amount?.replace(/,/g, '') || '0');
          return sum + amount;
        }, 0);
        
        calculatedCurrentLiabilities = {
          account_nm: '유동부채(계산됨)',
          thstrm_amount: currentLiabilitiesSum.toString(),
          frmtrm_amount: '0'
        };
      }
      
      if (nonCurrentLiabilitiesItems.length > 0) {
        // 비유동부채 항목들의 합계 계산
        const nonCurrentLiabilitiesSum = nonCurrentLiabilitiesItems.reduce((sum: number, item: DartRawItem) => {
          const amount = Number(item.thstrm_amount?.replace(/,/g, '') || '0');
          return sum + amount;
        }, 0);
        
        calculatedNonCurrentLiabilities = {
          account_nm: '비유동부채(계산됨)',
          thstrm_amount: nonCurrentLiabilitiesSum.toString(),
          frmtrm_amount: '0'
        };
      }
    }

    // 부채 디버깅
    console.log('유동부채: ', calculatedCurrentLiabilities?.account_nm, calculatedCurrentLiabilities?.thstrm_amount);
    console.log('비유동부채: ', calculatedNonCurrentLiabilities?.account_nm, calculatedNonCurrentLiabilities?.thstrm_amount);
    console.log('총부채: ', totalLiabilities?.account_nm, totalLiabilities?.thstrm_amount);

    // 자본
    const initialTotalEquity = bsData.find((item: DartRawItem) => 
      item.account_nm === '자본총계' || 
      item.account_nm.includes('자본총계') ||
      item.account_nm.includes('자본 총계') ||
      item.account_nm.includes('자본합계')
    );
    let totalEquity = initialTotalEquity; // Use let as it might be calculated

    if (!totalEquity && totalAssets && totalLiabilities) {
      // 자산총계 - 부채총계 = 자본총계 공식 적용
      const assetsValue = Number(totalAssets.thstrm_amount?.replace(/,/g, '') || '0');
      const liabilitiesValue = Number(totalLiabilities.thstrm_amount?.replace(/,/g, '') || '0');
      const equityValue = assetsValue - liabilitiesValue;
      
      totalEquity = {
        account_nm: '자본총계(계산됨)',
        thstrm_amount: equityValue.toString(),
        frmtrm_amount: '0'
      };
    }

    // 자본 디버깅
    console.log('자본총계: ', totalEquity?.account_nm, totalEquity?.thstrm_amount);

    const currentYear = bsData[0]?.thstrm_dt || '당기'; // 당기
    const previousYear = bsData[0]?.frmtrm_dt || '전기'; // 전기
    
    // 연결 재무제표 여부 확인
    const isConsolidated = data.isConsolidated || false;
    
    // 디버깅: 연결 재무제표 여부
    console.log('연결 재무제표 여부:', isConsolidated);

    // 디버깅
    console.log('총자산 원시값:', totalAssets?.thstrm_amount, '변환 결과:', convertToUnit(totalAssets?.thstrm_amount || '0'));
  
    const processedData: BalanceSheet = {
      rawData: {
        years: {
          current: currentYear,
          previous: previousYear,
        },
        isConsolidated: isConsolidated, // 연결 재무제표 여부 추가
        assets: {
          rawCurrent: calculatedCurrentAssets?.thstrm_amount || '0',
          rawNonCurrent: calculatedNonCurrentAssets?.thstrm_amount || '0',
          rawTotal: totalAssets?.thstrm_amount || '0',
          prevRawCurrent: calculatedCurrentAssets?.frmtrm_amount || '0',
          prevRawNonCurrent: calculatedNonCurrentAssets?.frmtrm_amount || '0',
          prevRawTotal: totalAssets?.frmtrm_amount || '0',
          current: convertToUnit(calculatedCurrentAssets?.thstrm_amount || '0'),
          nonCurrent: convertToUnit(calculatedNonCurrentAssets?.thstrm_amount || '0'),
          total: convertToUnit(totalAssets?.thstrm_amount || '0'),
          prevCurrent: convertToUnit(calculatedCurrentAssets?.frmtrm_amount || '0'),
          prevNonCurrent: convertToUnit(calculatedNonCurrentAssets?.frmtrm_amount || '0'),
          prevTotal: convertToUnit(totalAssets?.frmtrm_amount || '0'),
        },
        liabilities: {
          rawCurrent: calculatedCurrentLiabilities?.thstrm_amount || '0',
          rawNonCurrent: calculatedNonCurrentLiabilities?.thstrm_amount || '0',
          rawTotal: totalLiabilities?.thstrm_amount || '0',
          prevRawCurrent: calculatedCurrentLiabilities?.frmtrm_amount || '0',
          prevRawNonCurrent: calculatedNonCurrentLiabilities?.frmtrm_amount || '0',
          prevRawTotal: totalLiabilities?.frmtrm_amount || '0',
          current: convertToUnit(calculatedCurrentLiabilities?.thstrm_amount || '0'),
          nonCurrent: convertToUnit(calculatedNonCurrentLiabilities?.thstrm_amount || '0'),
          total: convertToUnit(totalLiabilities?.thstrm_amount || '0'),
          prevCurrent: convertToUnit(calculatedCurrentLiabilities?.frmtrm_amount || '0'),
          prevNonCurrent: convertToUnit(calculatedNonCurrentLiabilities?.frmtrm_amount || '0'),
          prevTotal: convertToUnit(totalLiabilities?.frmtrm_amount || '0'),
        },
        equity: {
          rawTotal: totalEquity?.thstrm_amount || '0',
          prevRawTotal: totalEquity?.frmtrm_amount || '0',
          total: convertToUnit(totalEquity?.thstrm_amount || '0'),
          prevTotal: convertToUnit(totalEquity?.frmtrm_amount || '0'),
        },
      },
      chartData: {
        labels: ['자산', '부채', '자본'],
        datasets: [
          {
            label: currentYear,
            data: [
              convertToUnit(totalAssets?.thstrm_amount || '0'),
              convertToUnit(totalLiabilities?.thstrm_amount || '0'),
              convertToUnit(totalEquity?.thstrm_amount || '0'),
            ],
            backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
            borderWidth: 1,
          },
          {
            label: previousYear,
            data: [
              convertToUnit(totalAssets?.frmtrm_amount || '0'),
              convertToUnit(totalLiabilities?.frmtrm_amount || '0'),
              convertToUnit(totalEquity?.frmtrm_amount || '0'),
            ],
            backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
            borderWidth: 1,
          },
        ],
      },
    };
    
    return processedData;
  } catch (error) {
    console.error('processBalanceSheet 오류:', error);
    return createEmptyBalanceSheet();
  }
}

// 손익계산서 데이터 가공
export function processIncomeStatement(data: DartApiResponse): IncomeStatement {
  try {
    const isData: DartRawItem[] = data.list || [];
    
    // 디버깅: 계정명 확인
    console.log('손익계산서 계정 목록:', isData.map((item: DartRawItem) => ({ 
      계정명: item.account_nm, 
      당기값: item.thstrm_amount, 
      전기값: item.frmtrm_amount 
    })));
    
    // Change initial finds to const
    const initialRevenue = isData.find((item: DartRawItem) => 
      item.account_nm === '매출액' || 
      item.account_nm.includes('매출액') || 
      item.account_nm.includes('영업수익') ||
      item.account_nm.includes('영업 수익') ||
      item.account_nm.includes('수익(매출액)')
    );
    
    const initialOperatingProfit = isData.find((item: DartRawItem) => 
      item.account_nm === '영업이익' || 
      item.account_nm.includes('영업이익') || 
      item.account_nm.includes('영업 이익') ||
      item.account_nm.includes('영업이익(손실)')
    );
    
    const initialNetIncome = isData.find((item: DartRawItem) => 
      item.account_nm === '당기순이익' || 
      item.account_nm.includes('당기순이익') || 
      item.account_nm.includes('당기 순이익') ||
      item.account_nm.includes('당기순이익(손실)') ||
      item.account_nm.includes('당기순손익')
    );
    
    // Use let for variables that might be recalculated
    let revenue = initialRevenue;
    let operatingProfit = initialOperatingProfit;
    let netIncome = initialNetIncome;
    
    if (!revenue) {
      const revenueItems = isData.filter((item: DartRawItem) => 
        item.account_nm.includes('매출') || 
        item.account_nm.includes('수익')
      );
      
      if (revenueItems.length > 0) {
        // 첫 번째 매출 관련 항목 사용
        revenue = revenueItems[0];
      }
    }
    
    if (!operatingProfit) {
      // 매출총이익 찾기 시도
      const grossProfit = isData.find((item: DartRawItem) => 
        item.account_nm.includes('매출총이익') || 
        item.account_nm.includes('매출총손익')
      );
      
      // 판관비 찾기 시도
      const expenses = isData.find((item: DartRawItem) => 
        item.account_nm.includes('판매비와관리비') || 
        item.account_nm.includes('판매비') ||
        item.account_nm.includes('관리비')
      );
      
      if (grossProfit && expenses) {
        // 매출총이익 - 판관비 = 영업이익 공식 적용
        const grossProfitValue = Number(grossProfit.thstrm_amount?.replace(/,/g, '') || '0');
        const expensesValue = Number(expenses.thstrm_amount?.replace(/,/g, '') || '0');
        const operatingProfitValue = grossProfitValue - expensesValue;
        
        operatingProfit = {
          account_nm: '영업이익(계산됨)',
          thstrm_amount: operatingProfitValue.toString(),
          frmtrm_amount: '0'
        };
      }
    }
    
    if (!netIncome) {
      const netItems = isData.filter((item: DartRawItem) => 
        item.account_nm.includes('순이익') || 
        item.account_nm.includes('순손익') ||
        item.account_nm.includes('당기') && (item.account_nm.includes('이익') || item.account_nm.includes('손익'))
      );
      
      if (netItems.length > 0) {
        // 첫 번째 당기순이익 관련 항목 사용
        netIncome = netItems[0];
      }
    }
    
    const currentPeriod = isData[0]?.thstrm_dt || '당기'; // 당기
    const previousPeriod = isData[0]?.frmtrm_dt || '전기'; // 전기

    // 디버깅
    console.log('매출액: ', revenue?.account_nm, revenue?.thstrm_amount);
    console.log('영업이익: ', operatingProfit?.account_nm, operatingProfit?.thstrm_amount);
    console.log('당기순이익: ', netIncome?.account_nm, netIncome?.thstrm_amount);

    const revenueConverted = convertToUnit(revenue?.thstrm_amount || '0');
    const operatingProfitConverted = convertToUnit(operatingProfit?.thstrm_amount || '0');
    const netIncomeConverted = convertToUnit(netIncome?.thstrm_amount || '0');

    const processedData: IncomeStatement = {
      rawData: {
        years: {
          current: currentPeriod,
          previous: previousPeriod,
          currentPeriod: currentPeriod, // 당기 표시용
        },
        rawRevenue: revenue?.thstrm_amount || '0',
        rawOperatingProfit: operatingProfit?.thstrm_amount || '0',
        rawNetIncome: netIncome?.thstrm_amount || '0',
        revenue: revenueConverted,
        operatingProfit: operatingProfitConverted,
        netIncome: netIncomeConverted,
      },
      chartData: {
        labels: ['매출액', '영업이익', '당기순이익'],
        datasets: [
          {
            label: currentPeriod,
            data: [
              convertToUnit(revenue?.thstrm_amount || '0'),
              convertToUnit(operatingProfit?.thstrm_amount || '0'),
              convertToUnit(netIncome?.thstrm_amount || '0'),
            ],
            backgroundColor: [
              'rgba(255, 206, 86, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(75, 192, 192, 0.2)',
            ],
            borderColor: [
              'rgba(255, 206, 86, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
          {
            label: previousPeriod,
            data: [
              convertToUnit(revenue?.frmtrm_amount || '0'),
              convertToUnit(operatingProfit?.frmtrm_amount || '0'),
              convertToUnit(netIncome?.frmtrm_amount || '0'),
            ],
            backgroundColor: [
              'rgba(255, 206, 86, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(75, 192, 192, 0.6)',
            ],
            borderColor: [
              'rgba(255, 206, 86, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(75, 192, 192, 1)',
            ],
            borderWidth: 1,
          },
        ],
      },
    };
    
    return processedData;
  } catch (error) {
    console.error('processIncomeStatement 오류:', error);
    return createEmptyIncomeStatement();
  }
}

// 재무비율 계산
export function calculateFinancialRatios(balanceSheet: BalanceSheet, incomeStatement: IncomeStatement): FinancialRatios {
  const bs = balanceSheet.rawData;
  const is = incomeStatement.rawData;
  
  // 비율 계산
  const ratios = {
    // 유동비율 (유동자산 / 유동부채)
    currentRatio: bs.liabilities.current !== 0 
      ? (bs.assets.current / bs.liabilities.current * 100).toFixed(2)
      : 'N/A',
    
    // 부채비율 (부채총계 / 자본총계)
    debtToEquityRatio: bs.equity.total !== 0
      ? (bs.liabilities.total / bs.equity.total * 100).toFixed(2)
      : 'N/A',
    
    // 자기자본비율 (자본총계 / 자산총계)
    equityRatio: bs.assets.total !== 0
      ? (bs.equity.total / bs.assets.total * 100).toFixed(2)
      : 'N/A',
    
    // 매출액영업이익률 (영업이익 / 매출액)
    operatingProfitMargin: is.revenue !== 0
      ? (is.operatingProfit / is.revenue * 100).toFixed(2)
      : 'N/A',
    
    // 매출액순이익률 (당기순이익 / 매출액)
    netProfitMargin: is.revenue !== 0
      ? (is.netIncome / is.revenue * 100).toFixed(2)
      : 'N/A',
    
    // ROE (당기순이익 / 자본총계)
    returnOnEquity: bs.equity.total !== 0
      ? (is.netIncome / bs.equity.total * 100).toFixed(2)
      : 'N/A',
    
    // ROA (당기순이익 / 자산총계)
    returnOnAssets: bs.assets.total !== 0
      ? (is.netIncome / bs.assets.total * 100).toFixed(2)
      : 'N/A'
  };
  
  // 성장률 계산
  // 현재 기간 값
  const currentAssetValue = convertToUnit(balanceSheet.rawData.assets.rawTotal);
  const currentRevenueValue = convertToUnit(incomeStatement.rawData.rawRevenue);
  const currentOpProfitValue = convertToUnit(incomeStatement.rawData.rawOperatingProfit);
  const currentNetIncomeValue = convertToUnit(incomeStatement.rawData.rawNetIncome);
  
  // 이전 기간 값 (원시 데이터로부터 직접 변환)
  const previousAssetValue = balanceSheet.chartData.datasets[1].data[0];
  const previousRevenueValue = incomeStatement.chartData.datasets[1].data[0];
  const previousOpProfitValue = incomeStatement.chartData.datasets[1].data[1];
  const previousNetIncomeValue = incomeStatement.chartData.datasets[1].data[2];
  
  // 성장률 계산 (이전 값이 0이거나 없으면 0 반환)
  const growthRates = {
    assetGrowth: previousAssetValue > 0 ? 
      ((currentAssetValue - previousAssetValue) / Math.abs(previousAssetValue)) * 100 : 0,
    revenueGrowth: previousRevenueValue > 0 ? 
      ((currentRevenueValue - previousRevenueValue) / Math.abs(previousRevenueValue)) * 100 : 0,
    operatingProfitGrowth: previousOpProfitValue > 0 ? 
      ((currentOpProfitValue - previousOpProfitValue) / Math.abs(previousOpProfitValue)) * 100 : 0,
    netIncomeGrowth: previousNetIncomeValue > 0 ? 
      ((currentNetIncomeValue - previousNetIncomeValue) / Math.abs(previousNetIncomeValue)) * 100 : 0,
  };
  
  // 디버깅: 성장률 계산 과정 출력
  console.log('성장률 계산 정보:', {
    자산: { 당기: currentAssetValue, 전기: previousAssetValue, 성장률: growthRates.assetGrowth },
    매출: { 당기: currentRevenueValue, 전기: previousRevenueValue, 성장률: growthRates.revenueGrowth },
    영업이익: { 당기: currentOpProfitValue, 전기: previousOpProfitValue, 성장률: growthRates.operatingProfitGrowth },
    당기순이익: { 당기: currentNetIncomeValue, 전기: previousNetIncomeValue, 성장률: growthRates.netIncomeGrowth }
  });
  
  // 재무비율 차트 데이터
  const ratiosChartData = {
    labels: ['유동비율', '부채비율', '자기자본비율', '매출액영업이익률', '매출액순이익률', 'ROE', 'ROA'],
    datasets: [
      {
        label: '재무비율(%)',
        data: [
          ratios.currentRatio !== 'N/A' ? parseFloat(ratios.currentRatio) : 0,
          ratios.debtToEquityRatio !== 'N/A' ? parseFloat(ratios.debtToEquityRatio) : 0,
          ratios.equityRatio !== 'N/A' ? parseFloat(ratios.equityRatio) : 0,
          ratios.operatingProfitMargin !== 'N/A' ? parseFloat(ratios.operatingProfitMargin) : 0,
          ratios.netProfitMargin !== 'N/A' ? parseFloat(ratios.netProfitMargin) : 0,
          ratios.returnOnEquity !== 'N/A' ? parseFloat(ratios.returnOnEquity) : 0,
          ratios.returnOnAssets !== 'N/A' ? parseFloat(ratios.returnOnAssets) : 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(201, 203, 207, 0.7)',
          'rgba(255, 205, 86, 0.7)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(201, 203, 207, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Add logging for debugging
  console.log('Balance Sheet Raw Data:', JSON.stringify(bs, null, 2));
  console.log('Income Statement Raw Data:', JSON.stringify(is, null, 2));

  // Log calculated ratios
  console.log('Calculated Ratios:', JSON.stringify(ratios, null, 2));

  // Log growth rates
  console.log('Calculated Growth Rates:', JSON.stringify(growthRates, null, 2));
  
  return {
    data: {
      ...ratios,
      ...growthRates
    },
    chartData: ratiosChartData
  };
}

// 빈 재무상태표 생성 함수
function createEmptyBalanceSheet(): BalanceSheet {
  return {
    rawData: {
      years: {
        current: '당기',
        previous: '전기',
      },
      isConsolidated: false, // 연결 재무제표 여부 기본값
      assets: {
        rawCurrent: '0',
        rawNonCurrent: '0',
        rawTotal: '0',
        prevRawCurrent: '0',
        prevRawNonCurrent: '0',
        prevRawTotal: '0',
        current: 0,
        nonCurrent: 0,
        total: 0,
        prevCurrent: 0,
        prevNonCurrent: 0,
        prevTotal: 0,
      },
      liabilities: {
        rawCurrent: '0',
        rawNonCurrent: '0',
        rawTotal: '0',
        prevRawCurrent: '0',
        prevRawNonCurrent: '0',
        prevRawTotal: '0',
        current: 0,
        nonCurrent: 0,
        total: 0,
        prevCurrent: 0,
        prevNonCurrent: 0,
        prevTotal: 0,
      },
      equity: {
        rawTotal: '0',
        prevRawTotal: '0',
        total: 0,
        prevTotal: 0,
      },
    },
    chartData: {
      labels: ['자산', '부채', '자본'],
      datasets: [
        {
          label: '당기',
          data: [0, 0, 0],
          backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(75, 192, 192, 0.2)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1,
        },
        {
          label: '전기',
          data: [0, 0, 0],
          backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)', 'rgba(75, 192, 192, 0.6)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'],
          borderWidth: 1,
        },
      ],
    },
  };
}

// 빈 손익계산서 생성 함수
function createEmptyIncomeStatement(): IncomeStatement {
  return {
    rawData: {
      years: {
        current: '당기',
        previous: '전기',
        currentPeriod: '당기',
      },
      rawRevenue: '0',
      rawOperatingProfit: '0',
      rawNetIncome: '0',
      revenue: 0,
      operatingProfit: 0,
      netIncome: 0,
    },
    chartData: {
      labels: ['매출액', '영업이익', '당기순이익'],
      datasets: [
        {
          label: '당기',
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(255, 206, 86, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(75, 192, 192, 0.2)',
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
        {
          label: '전기',
          data: [0, 0, 0],
          backgroundColor: [
            'rgba(255, 206, 86, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    },
  };
} 