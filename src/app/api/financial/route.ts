import { NextRequest, NextResponse } from 'next/server';
import { getFinancialStatements } from '@/lib/services/companyService';
import { processBalanceSheet, processIncomeStatement, calculateFinancialRatios } from '@/lib/utils/financialUtils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const corpCode = searchParams.get('corp_code');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const reportCode = searchParams.get('report_code') || '11011'; // 사업보고서
    
    if (!corpCode) {
      return NextResponse.json({ error: '회사 코드가 필요합니다' }, { status: 400 });
    }
    
    console.log(`재무제표 API 요청 시작: 회사코드=${corpCode}, 연도=${year}, 보고서=${reportCode}`);
    
    // 재무제표 데이터 가져오기
    const financialData = await getFinancialStatements(corpCode, year, reportCode);
    
    // 데이터 검증
    if (!financialData || !financialData.list || financialData.list.length === 0) {
      console.error('빈 재무제표 데이터 반환됨:', financialData);
      return NextResponse.json({ error: '재무제표 데이터가 없습니다. 다른 연도를 선택해 주세요.' }, { status: 404 });
    }
    
    console.log(`재무제표 데이터 가공 시작: 계정 수=${financialData.list.length}`);
    
    // 데이터 가공
    const balanceSheet = processBalanceSheet(financialData);
    const incomeStatement = processIncomeStatement(financialData);
    const ratios = calculateFinancialRatios(balanceSheet, incomeStatement);
    
    console.log('재무제표 처리 완료');
    
    return NextResponse.json({
      balanceSheet,
      incomeStatement,
      ratios
    });
  } catch (error: any) {
    console.error('재무제표 가져오기 오류:', error);
    
    // 오류 메시지와 상태 코드 결정
    let statusCode = 500;
    let errorMessage = error.message || '재무제표 데이터를 가져오는 중 오류가 발생했습니다';
    
    // 특정 오류 메시지에 따라 상태 코드 조정
    if (errorMessage.includes('데이터가 없습니다') || errorMessage.includes('존재하지 않습니다')) {
      statusCode = 404; // Not Found
    } else if (errorMessage.includes('API 키') || errorMessage.includes('잘못된 API 요청')) {
      statusCode = 400; // Bad Request
    } else if (errorMessage.includes('네트워크') || errorMessage.includes('타임아웃')) {
      statusCode = 503; // Service Unavailable
    }
    
    // 상세 오류 정보를 로그로 남김
    console.error(`API 오류 응답: [${statusCode}] ${errorMessage}`);
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode }
    );
  }
} 