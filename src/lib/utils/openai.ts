import OpenAI from 'openai';

// OpenAI API 설정
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 추가해주세요.');
  }
  
  return new OpenAI({
    apiKey: apiKey
  });
};

// 재무제표 분석 함수
export const analyzeFinancialStatements = async (balanceSheet: any, incomeStatement: any, ratios: any) => {
  try {
    // API 키가 없으면 처리하지 않음
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API 키가 없습니다. 분석을 건너뜁니다.');
      return null;
    }
    
    const openai = getOpenAIClient();
    
    // 재무제표 데이터 정리
    const bs = balanceSheet.rawData;
    const is = incomeStatement.rawData;
    const financialRatios = ratios.data;
    
    // 프롬프트 작성
    const prompt = `
    당신은 금융 분석가입니다. 아래 재무제표 데이터를 분석하여 중학생도 이해할 수 있는 쉬운 말로 분석 결과를 제공해주세요.
    
    # 재무상태표 (단위: 억원)
    - 자산총계: ${bs.assets.total.toFixed(2)} (전년 ${bs.assets.prevTotal.toFixed(2)}, 증감률: ${((bs.assets.total - bs.assets.prevTotal) / bs.assets.prevTotal * 100).toFixed(2)}%)
    - 유동자산: ${bs.assets.current.toFixed(2)} (전년 ${bs.assets.prevCurrent.toFixed(2)})
    - 비유동자산: ${bs.assets.nonCurrent.toFixed(2)} (전년 ${bs.assets.prevNonCurrent.toFixed(2)})
    - 부채총계: ${bs.liabilities.total.toFixed(2)} (전년 ${bs.liabilities.prevTotal.toFixed(2)}, 증감률: ${((bs.liabilities.total - bs.liabilities.prevTotal) / bs.liabilities.prevTotal * 100).toFixed(2)}%)
    - 유동부채: ${bs.liabilities.current.toFixed(2)} (전년 ${bs.liabilities.prevCurrent.toFixed(2)})
    - 비유동부채: ${bs.liabilities.nonCurrent.toFixed(2)} (전년 ${bs.liabilities.prevNonCurrent.toFixed(2)})
    - 자본총계: ${bs.equity.total.toFixed(2)} (전년 ${bs.equity.prevTotal.toFixed(2)}, 증감률: ${((bs.equity.total - bs.equity.prevTotal) / bs.equity.prevTotal * 100).toFixed(2)}%)
    
    # 손익계산서 (단위: 억원)
    - 매출액: ${is.revenue.toFixed(2)} (전년 ${incomeStatement.chartData.datasets[1].data[0].toFixed(2)}, 증감률: ${((is.revenue - incomeStatement.chartData.datasets[1].data[0]) / incomeStatement.chartData.datasets[1].data[0] * 100).toFixed(2)}%)
    - 영업이익: ${is.operatingProfit.toFixed(2)} (전년 ${incomeStatement.chartData.datasets[1].data[1].toFixed(2)}, 증감률: ${((is.operatingProfit - incomeStatement.chartData.datasets[1].data[1]) / incomeStatement.chartData.datasets[1].data[1] * 100).toFixed(2)}%)
    - 당기순이익: ${is.netIncome.toFixed(2)} (전년 ${incomeStatement.chartData.datasets[1].data[2].toFixed(2)}, 증감률: ${((is.netIncome - incomeStatement.chartData.datasets[1].data[2]) / incomeStatement.chartData.datasets[1].data[2] * 100).toFixed(2)}%)
    
    # 재무비율
    - 유동비율: ${financialRatios.currentRatio}%
    - 부채비율: ${financialRatios.debtToEquityRatio}%
    - 자기자본비율: ${financialRatios.equityRatio}%
    - 매출액영업이익률: ${financialRatios.operatingProfitMargin}%
    - 매출액순이익률: ${financialRatios.netProfitMargin}%
    - ROE(자기자본수익률): ${financialRatios.returnOnEquity}%
    - ROA(총자산수익률): ${financialRatios.returnOnAssets}%
    
    이 회사의 재무상태와 수익성을 중학생도 쉽게 이해할 수 있는 말로 설명해주세요. 다음 내용을 포함해주세요:
    1. 회사의 전반적인 재무상태 (자산, 부채, 자본의 현황과 증감)
    2. 회사의 수익성 (매출, 영업이익, 순이익의 변화)
    3. 재무건전성 평가 (유동비율, 부채비율 등을 바탕으로)
    4. 투자자 관점에서의 간단한 의견 (ROE, ROA 등을 고려하여)
    
    모든 설명은 쉬운 용어와 비유를 사용하여 중학생도 이해할 수 있게 작성해주세요.
    `;
    
    // GPT-4o를 사용한 분석 요청
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // 또는 사용 가능한 최신 모델
      messages: [
        {
          role: "system",
          content: "당신은 재무제표를 쉽게 설명해주는 금융 분석가입니다. 항상 중학생도 이해할 수 있는 쉬운 말로 설명합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    // 응답에서 분석 내용 추출
    const analysis = response.choices[0].message?.content || "분석 결과를 가져올 수 없습니다.";
    return analysis;
    
  } catch (error) {
    console.error('재무제표 분석 오류:', error);
    return "재무제표 분석 중 오류가 발생했습니다.";
  }
}; 