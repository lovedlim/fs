'use client';

import { useState } from 'react';
import { FinancialData, BalanceSheet, IncomeStatement, FinancialRatios } from '@/types/financial';
import ReactMarkdown from 'react-markdown';

interface FinancialAnalysisProps {
  balanceSheet: BalanceSheet | null;
  incomeStatement: IncomeStatement | null;
  ratios: FinancialRatios | null;
}

// 재무제표 분석 컴포넌트
export default function FinancialAnalysis({ balanceSheet, incomeStatement, ratios }: FinancialAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 분석 실행 함수
  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    // Ensure data exists before fetching
    if (!balanceSheet || !incomeStatement || !ratios) {
        setError('분석에 필요한 재무 데이터가 부족합니다.');
        setLoading(false);
        return;
    }
    
    try {
      const response = await fetch('/api/analyze', { // Assuming this is the correct endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ // Send only the data needed by the API
          balanceSheet, 
          incomeStatement, 
          ratios 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to parse error response
        throw new Error(errorData?.error || `분석 결과를 가져오는데 실패했습니다 (${response.status})`);
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error: unknown) {
      console.error('분석 결과 가져오기 오류:', error);
      setError(error instanceof Error ? error.message : '분석 결과를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  // 분석 기능 설명 메시지
  const analysisDescription = (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <p className="text-base text-gray-600 font-semibold">
        재무제표 AI 분석 기능
      </p>
      <ul className="mt-2 list-disc pl-5 text-gray-600">
        <li>회사의 재무구조와 수익성을 자동으로 검토하고 분석</li>
        <li>다년간의 재무지표 변화 추이를 파악하여 경영 안정성 평가</li>
        <li>주요 재무비율을 통한 기업 가치 판단 지원</li>
      </ul>
      <p className="mt-3 text-sm text-gray-500 italic">
        * 페이지 하단의 "재미있는 재무제표 (재재)"에서는 더 상세한 설명과 함께 사용자 요청 시 추가적인 재무 분석 정보를 제공합니다.
      </p>
    </div>
  );
  
  // 로딩 중 표시
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">재무제표 AI 분석</h3>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="ml-4 text-gray-600">분석 중입니다. 잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }
  
  // 오류 발생 시 표시
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">재무제표 AI 분석</h3>
        <div className="p-4 bg-red-50 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
        {analysisDescription}
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            분석 다시 시도
          </button>
        </div>
      </div>
    );
  }
  
  // 분석 결과가 없을 때
  if (!analysis) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-bold mb-5 text-gray-800 border-b pb-2">재무제표 AI 분석</h3>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">버튼을 클릭하여 재무제표 AI 분석을 시작하세요.</p>
          <button
            onClick={fetchAnalysis}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            AI 분석 시작
          </button>
        </div>
        {analysisDescription}
      </div>
    );
  }
  
  // 분석 결과 표시
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <div className="flex justify-between items-center mb-5 border-b pb-2">
        <h3 className="text-xl font-bold text-gray-800">재무제표 AI 분석</h3>
        <button
          onClick={fetchAnalysis}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          분석 다시 실행
        </button>
      </div>
      <div className="prose max-w-none">
        {/* 분석 결과 텍스트를 단락별로 나누어 표시 */}
        {analysis.split('\n\n').map((paragraph, index) => (
          <p key={index} className="mb-4 text-gray-700 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
       <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
         {/* Example fix for potential unescaped quotes */}
         <p>참고: 이 분석은 AI에 의해 생성되었으며, 실제 재무 전문가의 의견을 대체할 수 없습니다. 분석 기준년도는 달라질 수 있습니다.</p>
       </div>
    </div>
  );
} 