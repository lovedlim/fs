import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ApiError, Company, FinancialData } from '@/types/financial';

export async function POST(request: NextRequest) {
  try {
    const { company, year, balanceSheet, incomeStatement, ratios }: {
      company: Company;
      year: string;
      balanceSheet: FinancialData['balanceSheet'];
      incomeStatement: FinancialData['incomeStatement'];
      ratios: FinancialData['ratios'];
    } = await request.json();
    
    // API 키 환경변수 확인
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 설정하세요.' },
        { status: 500 }
      );
    }
    
    // OpenAI 클라이언트 초기화
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // 재무데이터 분석을 위한 프롬프트 작성
    const bs = balanceSheet.rawData;
    const is = incomeStatement.rawData;
    const r = ratios.data;
    
    // 재무제표 및 회사정보 문자열로 변환
    const companyName = company.corp_name;
    const financialData = `
회사명: ${companyName}
연도: ${year}년

1. 재무상태표 (단위: 억원)
- 유동자산: ${bs.assets.current.toLocaleString()} (전년: ${bs.assets.prevCurrent.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.assets.current, bs.assets.prevCurrent)}%)
- 비유동자산: ${bs.assets.nonCurrent.toLocaleString()} (전년: ${bs.assets.prevNonCurrent.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.assets.nonCurrent, bs.assets.prevNonCurrent)}%)
- 자산총계: ${bs.assets.total.toLocaleString()} (전년: ${bs.assets.prevTotal.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.assets.total, bs.assets.prevTotal)}%)
- 유동부채: ${bs.liabilities.current.toLocaleString()} (전년: ${bs.liabilities.prevCurrent.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.liabilities.current, bs.liabilities.prevCurrent)}%)
- 비유동부채: ${bs.liabilities.nonCurrent.toLocaleString()} (전년: ${bs.liabilities.prevNonCurrent.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.liabilities.nonCurrent, bs.liabilities.prevNonCurrent)}%)
- 부채총계: ${bs.liabilities.total.toLocaleString()} (전년: ${bs.liabilities.prevTotal.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.liabilities.total, bs.liabilities.prevTotal)}%)
- 자본총계: ${bs.equity.total.toLocaleString()} (전년: ${bs.equity.prevTotal.toLocaleString()}, 증감률: ${calculateGrowthRate(bs.equity.total, bs.equity.prevTotal)}%)

2. 손익계산서 (단위: 억원)
- 매출액: ${is.revenue.toLocaleString()}
- 영업이익: ${is.operatingProfit.toLocaleString()}
- 당기순이익: ${is.netIncome.toLocaleString()}

3. 주요 재무비율
- 유동비율: ${r.currentRatio}%
- 부채비율: ${r.debtToEquityRatio}%
- 자기자본비율: ${r.equityRatio}%
- 매출액영업이익률: ${r.operatingProfitMargin}%
- 매출액순이익률: ${r.netProfitMargin}%
- ROE(자기자본이익률): ${r.returnOnEquity}%
- ROA(총자산이익률): ${r.returnOnAssets}%

4. 성장률
- 자산 성장률: ${ratios.data.assetGrowth.toFixed(2)}%
- 매출 성장률: ${ratios.data.revenueGrowth.toFixed(2)}%
- 영업이익 성장률: ${ratios.data.operatingProfitGrowth.toFixed(2)}%
- 당기순이익 성장률: ${ratios.data.netIncomeGrowth.toFixed(2)}%
`;

    // 프롬프트 구성
    const prompt = `
다음은 ${companyName}의 ${year}년 재무제표 데이터입니다:

${financialData}

이 재무제표 데이터를 중학생도 이해할 수 있는 매우 쉬운 언어로 분석해주세요. 
다음 내용을 포함해야 합니다:

1. 이 회사의 재무상태가 좋은지 나쁜지 (유동성, 안정성, 수익성 관점에서)
2. 이 회사가 작년에 비해 어떻게 성장했는지
3. 중요한 재무 비율과 지표들의 의미를 쉽게 설명
4. 이 회사의 재무적 강점과 약점
5. 전년도와 비교하여 특별히 주목할 만한 변화

5~6문장 정도의 짧은 단락으로 핵심을 쉽게 설명하고, 전문 용어는 반드시 쉬운 말로 풀어서 설명해주세요.
실제 중학생이 이해할 수 있도록 매우 쉬운 언어로 작성해주세요.
`;

    // OpenAI API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // 또는 "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "당신은 재무제표를 중학생도 이해할 수 있게 쉽게 설명해주는 친절한 재무 전문가입니다." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // 응답에서 분석 텍스트 추출
    const analysis = response.choices[0]?.message?.content || "분석 결과를 생성하지 못했습니다.";

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error('AI 분석 오류:', error);
    
    // API 오류 타입 체크 및 처리
    const apiError = error as ApiError;
    
    // OpenAI API 관련 오류 메시지 처리
    if (apiError.response) {
      return NextResponse.json(
        { error: `OpenAI API 오류: ${apiError.response.status || 500} - ${apiError.response.data?.error?.message || '알 수 없는 오류'}` },
        { status: apiError.response.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: apiError.message || 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 증감률 계산 함수
function calculateGrowthRate(current: number, previous: number): string {
  if (!previous || previous === 0) return "N/A";
  const rate = ((current - previous) / Math.abs(previous) * 100).toFixed(2);
  return rate;
} 