import { NextRequest, NextResponse } from 'next/server';
import { getFinancialStatements } from '@/lib/services/companyService';
import { processBalanceSheet, processIncomeStatement } from '@/lib/utils/financialUtils';
import { calculateFinancialRatios } from '@/lib/utils/financeRatios';
import { ApiError } from '@/types/financial';

export async function GET(request: NextRequest) {
  try {
    // URL에서 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const corpCode = searchParams.get('corp_code');
    const year = searchParams.get('year');
    const reportCode = searchParams.get('report_code') || '11011'; // 기본값 설정 (사업보고서)
    
    // 필수 파라미터 확인
    if (!corpCode || !year) {
      return NextResponse.json(
        { error: '회사코드(corp_code)와 년도(year)는 필수 파라미터입니다.' },
        { status: 400 }
      );
    }
    
    // 재무제표 데이터 가져오기
    const financialData = await getFinancialStatements(corpCode, year, reportCode);
    
    if (!financialData || !financialData.list || financialData.list.length === 0) {
      return NextResponse.json(
        { error: `해당 연도(${year})의 재무제표 데이터가 없습니다. 다른 연도를 선택해 주세요.` },
        { status: 404 }
      );
    }
    
    // 재무제표 데이터 처리
    const balanceSheet = processBalanceSheet(financialData);
    const incomeStatement = processIncomeStatement(financialData);
    
    // 재무비율 계산
    const ratios = calculateFinancialRatios(balanceSheet, incomeStatement);
    
    // 결과 반환
    return NextResponse.json({
      balanceSheet,
      incomeStatement,
      ratios
    });
    
  } catch (error: unknown) {
    console.error('재무제표 API 오류:', error);
    
    const apiError = error as ApiError;
    const errorMessage = '재무제표 데이터를 가져오는 중 오류가 발생했습니다';
    
    // DART API 응답에서 오류 메시지 추출 시도
    if (apiError.message) {
      if (apiError.message.includes('자동으로 조회합니다')) {
        return NextResponse.json({ error: apiError.message }, { status: 404 });
      }
      
      if (apiError.message.includes('API 키가 유효하지 않습니다')) {
        return NextResponse.json(
          { error: '금융감독원 API 키가 유효하지 않습니다. 환경 변수 DART_API_KEY를 확인해 주세요.' },
          { status: 401 }
        );
      }
      
      return NextResponse.json({ error: apiError.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 