'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import SearchBar from '@/components/SearchBar';
import FinancialCharts from '@/components/FinancialCharts';
import FinancialDetails from '@/components/FinancialDetails';
import FinancialAnalysis from '@/components/FinancialAnalysis';
import { Company, FinancialData } from '@/types/financial';

export default function Home() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [year, setYear] = useState<string>("2024");
  const [dataCache, setDataCache] = useState<{[key: string]: FinancialData}>({});
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  
  // API 호출 최적화를 위한 캐시
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  
  // 회사 선택 시 재무제표 데이터 가져오기
  const handleCompanySelect = useCallback(async (company: Company) => {
    setSelectedCompany(company);
    setLoading(true);
    setError(null);
    setAiAnalysis(null);
    
    // 캐시 키 생성
    const cacheKey = `${company.corp_code}_${year}`;
    
    try {
      // 캐시에 데이터가 있으면 재사용
      if (dataCache[cacheKey]) {
        console.log('캐시된 데이터 사용:', cacheKey);
        console.log('캐시된 데이터 내용:', dataCache[cacheKey]);
        setFinancialData(dataCache[cacheKey]);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`/api/financial`, {
        params: {
          corp_code: company.corp_code,
          year: year,
          report_code: '11011'
        }
      });
      
      // 응답 데이터가 없거나 형식이 맞지 않으면 오류 처리
      if (!response.data || !response.data.balanceSheet || !response.data.incomeStatement) {
        throw new Error('데이터 형식이 올바르지 않습니다');
      }
      
      console.log('API 응답 데이터:', response.data);
      console.log('BS 매출액:', response.data.balanceSheet?.rawData?.assets?.rawTotal);
      console.log('IS 매출액:', response.data.incomeStatement?.rawData?.rawRevenue);
      
      // 응답 데이터 캐시에 저장
      setDataCache(prev => ({
        ...prev,
        [cacheKey]: response.data
      }));
      
      setFinancialData(response.data);
    } catch (err: any) {
      console.error('재무제표 가져오기 오류:', err);
      
      // 오류 메시지 상세화
      let errorMessage = '재무제표 데이터를 가져오는 중 오류가 발생했습니다';
      
      if (err.response) {
        // 서버 응답이 있는 경우 (HTTP 상태 코드가 2xx가 아닌 경우)
        const statusCode = err.response.status;
        const serverError = err.response.data?.error || '알 수 없는 서버 오류';
        errorMessage = `서버 오류 (${statusCode}): ${serverError}`;
        console.log('서버 응답 오류 데이터:', err.response.data);
      } else if (err.request) {
        // 요청은 보냈지만 응답을 받지 못한 경우
        errorMessage = '서버에서 응답이 없습니다. 네트워크 연결을 확인해 주세요.';
      } else if (err.message) {
        // 요청 설정 중 오류가 발생한 경우
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setFinancialData(null);
    } finally {
      setLoading(false);
    }
  }, [year, dataCache]);
  
  // 연도 변경 시 재무제표 데이터 다시 가져오기
  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = event.target.value;
    setYear(newYear);
    
    if (selectedCompany) {
      handleCompanySelect(selectedCompany);
    }
  };

  // AI를 통한 재무제표 분석 요청
  const getAiAnalysis = async () => {
    if (!financialData) return;
    
    setAiLoading(true);
    try {
      const response = await axios.post('/api/ai-analysis', {
        company: selectedCompany,
        year: year,
        balanceSheet: financialData.balanceSheet,
        incomeStatement: financialData.incomeStatement,
        ratios: financialData.ratios
      });
      
      setAiAnalysis(response.data.analysis);
    } catch (err: any) {
      console.error('AI 분석 오류:', err);
      setAiAnalysis('죄송합니다. AI 분석 중 오류가 발생했습니다. OpenAI API 키가 제대로 설정되어 있는지 확인해 주세요.');
    } finally {
      setAiLoading(false);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 md:p-12 lg:p-24 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">재미있는 재무제표 (재재)</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">회사 검색</h2>
              <SearchBar onCompanySelect={handleCompanySelect} />
            </div>
            
            <div className="w-full md:w-auto">
              <h2 className="text-lg font-semibold mb-2 text-gray-700">연도 선택</h2>
              <select 
                value={year}
                onChange={handleYearChange}
                className="w-full md:w-40 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-semibold"
              >
                {/* 가용 데이터가 있는 년도만 보여주기 (2024~2015) */}
                {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                  <option key={year} value={year} className="text-gray-900 font-medium">{year}</option>
                ))}
              </select>
            </div>
          </div>
          
          {selectedCompany && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h2 className="text-xl font-bold text-gray-800">{selectedCompany.corp_name}</h2>
              {selectedCompany.stock_code && (
                <p className="text-gray-600">증권코드: {selectedCompany.stock_code}</p>
              )}
            </div>
          )}
        </div>
        
        {loading && (
          <div className="mt-12 mb-10 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && <div className="mt-10 text-red-500 text-center">{error}</div>}
        
        {!loading && !error && financialData && (
          <>
            {(() => { // Immediately invoked function expression to allow logging
              return null; // IIFE must return something renderable (or null)
            })()}
            <FinancialCharts 
              balanceSheet={financialData.balanceSheet} 
              incomeStatement={financialData.incomeStatement}
              ratios={financialData.ratios}
            />
            
            <FinancialDetails 
              balanceSheet={financialData.balanceSheet}
              incomeStatement={financialData.incomeStatement}
              ratios={financialData.ratios}
            />
            
            <FinancialAnalysis
              balanceSheet={financialData.balanceSheet}
              incomeStatement={financialData.incomeStatement}
              ratios={financialData.ratios}
            />

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">재미있는 재무제표 (재재)</h2>
                <button
                  onClick={getAiAnalysis}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiLoading ? '분석 중...' : 'AI 재무 분석'}
                </button>
              </div>
              
              {aiLoading && (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                  <p className="ml-4 text-gray-600">AI가 분석 중입니다...</p>
                </div>
              )}
              
              {!aiLoading && aiAnalysis && (
                <div className="mt-4 p-5 bg-blue-50 rounded-md">
                  <div className="prose max-w-none">
                    {aiAnalysis.split('\n').map((line, index) => (
                      <p key={index} className="my-2 text-gray-800">{line}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {!aiLoading && !aiAnalysis && (
                <div className="text-center p-8 text-gray-600">
                  <p className="font-medium text-lg mb-3">재미있는 재무제표 (재재) - AI 분석</p>
                  <p>AI 재무 분석 버튼을 클릭하면 재무제표에 대한 쉬운 설명을 제공합니다.</p>
                  <p className="mt-2 text-sm text-gray-500">OpenAI API를 사용해 중학생도 이해할 수 있는 수준으로 설명합니다.</p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
                    <p className="text-base text-gray-600 font-semibold">
                      AI 재무 분석 기능
                    </p>
                    <ul className="mt-2 list-disc pl-5 text-gray-600">
                      <li>회사의 재무상태가 좋은지 나쁜지를 유동성, 안정성, 수익성 관점에서 분석</li>
                      <li>작년에 비해 회사가 어떻게 성장했는지 종합적으로 평가</li>
                      <li>재무 비율과 지표들의 의미를 쉽게 설명하고 회사의 강점과 약점 분석</li>
                      <li>전년도와 비교하여 주목할 만한 변화 포인트 제시</li>
                    </ul>
                    <p className="mt-3 text-sm text-gray-500 italic">
                      * 상단의 "재무제표 AI 분석"이 기본적인 재무 구조 분석을 제공한다면, 이 기능은 더 상세하고 친절한 설명과 함께 경영 관점의 인사이트를 제공합니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        </div>
      </main>
  );
}
