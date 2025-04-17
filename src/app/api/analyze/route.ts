import { NextRequest, NextResponse } from 'next/server';
import { analyzeFinancialStatements } from '@/lib/utils/openai';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문에서 데이터 가져오기
    const body = await request.json();
    const { balanceSheet, incomeStatement, ratios } = body;
    
    // 필수 데이터 확인
    if (!balanceSheet || !incomeStatement || !ratios) {
      return NextResponse.json(
        { error: '필수 재무제표 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }
    
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }
    
    // 재무제표 분석
    const analysis = await analyzeFinancialStatements(balanceSheet, incomeStatement, ratios);
    
    // 분석 결과를 클라이언트에 반환
    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('재무제표 분석 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '재무제표 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 