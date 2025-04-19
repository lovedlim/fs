import { Company } from '../db/models';
import axios from 'axios';
import fs from 'fs';
import { Op } from 'sequelize';
import { Company as CompanyType } from '@/types/financial';
import { DartRawItem, DartApiResponse } from '@/lib/utils/financialUtils';

// 회사 검색 함수
export const searchCompany = async (keyword: string) => {
  console.log(`[searchCompany] Searching for keyword: ${keyword}`); // 함수 시작 로그
  try {
    // SQLite에서는 LIKE가 case-sensitive일 수 있으므로 다양한 검색 조건 추가
    const results = await Company.findAll({ // DB 쿼리 전 로그 추가 가능
      where: {
        [Op.or]: [
          { corp_name: { [Op.like]: `%${keyword}%` } },
          { corp_name: { [Op.like]: `%${keyword.toUpperCase()}%` } },
          { corp_name: { [Op.like]: `%${keyword.toLowerCase()}%` } }
        ]
      },
      limit: 20
    });
    console.log(`[searchCompany] Found ${results.length} companies.`); // DB 쿼리 성공 로그
    return results;
  } catch (error) {
    console.error(`[searchCompany] Error searching companies for keyword "${keyword}":`, error); // 에러 로그
    // 에러를 다시 던지거나 적절히 처리
    throw error;
  }
};

// 회사 정보를 파일에서 로드하여 DB에 저장 (Batch processing with bulkCreate)
export async function loadCompaniesFromFile(filePath: string): Promise<void> {
  let totalProcessed = 0;
  let totalCount = 0;
  try {
    console.log(`Reading file: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    console.log('File read complete. Parsing JSON...');
    const data: CompanyType[] = JSON.parse(fileContent);
    totalCount = data.length;
    console.log(`JSON parsing complete. Total companies: ${totalCount}`);

    if (!Array.isArray(data) || totalCount === 0) {
      console.log('No company data found in the file or data is not an array.');
      return; 
    }

    const batchSize = 1000; // Process 1000 records per batch
    console.log(`Starting database batch insert/update (batch size: ${batchSize})...`);

    for (let i = 0; i < totalCount; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      // Prepare data for bulkCreate
      const batchData = batch.map(companyData => ({
        corp_code: companyData.corp_code,
        corp_name: companyData.corp_name,
        stock_code: companyData.stock_code,
      }));

      try {
        // Perform bulk insert/update
        // Define fields to update on duplicate key (corp_code is unique)
        const fieldsToUpdate: Array<keyof CompanyType> = ['corp_name', 'stock_code'];
        await Company.bulkCreate(batchData, {
          updateOnDuplicate: fieldsToUpdate,
        });
        
        totalProcessed += batch.length;
        console.log(`DB 저장 진행: ${totalProcessed}/${totalCount}`);

      } catch (bulkError) {
        console.error(`Error during batch insert/update starting at index ${i}:`, bulkError);
        // Decide if you want to stop or continue on batch error
        // For simplicity, we'll stop here, but you could add retry logic or skip the batch
        throw new Error(`Batch processing failed at index ${i}.`); 
      }
    }
    
    console.log(`Batch processing finished.`);
    console.log(`${totalProcessed}개 회사 정보 DB 저장/업데이트 완료.`);

  } catch (error) {
    console.error('파일에서 회사 정보 로드 중 치명적 오류:', error);
    if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    // Re-throw or handle as needed
    // throw error;
  }
}

// DART API에서 재무제표 데이터 가져오기
export const getFinancialStatements = async (corpCode: string, year: string, reportCode: string): Promise<DartApiResponse> => {
  try {
    const apiKey = process.env.DART_API_KEY;
    if (!apiKey) {
      throw new Error('API 키가 없습니다. .env 파일에 DART_API_KEY를 설정하세요.');
    }
    
    console.log(`재무제표 API 요청: 회사코드=${corpCode}, 연도=${year}, 보고서코드=${reportCode}`);
    
    const response = await axios.get(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json`, {
      params: {
        crtfc_key: apiKey,
        corp_code: corpCode,
        bsns_year: year,
        reprt_code: reportCode
      },
      timeout: 10000 // 10초 타임아웃 설정
    });
    
    // 상태 코드와 메시지 로깅 추가
    console.log(`재무제표 API 응답 상태: ${response.data.status}, 메시지: ${response.data.message}`);
    
    if (response.data.status === '000') {
      if (!response.data.list || response.data.list.length === 0) {
        console.log(`(${corpCode}, ${year}) : Status 000이지만 list가 비어있음.`);
        if (parseInt(year) > 2015) {
          console.log(`${year}년 데이터 없음, ${parseInt(year) - 1}년 시도...`);
          return getFinancialStatements(corpCode, (parseInt(year) - 1).toString(), reportCode);
        } else {
          throw new Error(`데이터가 없는 가장 오래된 연도(2015)에 도달했습니다.`);
        }
      }
      
      // 재무제표 종류 확인 (연결 재무제표인지 개별 재무제표인지)
      const isConsolidated = checkIfConsolidated(response.data.list as DartRawItem[]);
      
      // 재무제표 종류를 응답에 포함하여 반환
      return {
        list: response.data.list as DartRawItem[],
        isConsolidated
      };
    } else if (response.data.status === '013') {
      console.log(`(${corpCode}, ${year}) : Status 013 - 데이터 없음`);
      if (parseInt(year) > 2015) {
        console.log(`${year}년 데이터 없음, ${parseInt(year) - 1}년 시도...`);
        return getFinancialStatements(corpCode, (parseInt(year) - 1).toString(), reportCode);
      } else {
        throw new Error(`조회 가능한 데이터가 없습니다 (최소 연도 도달).`);
      }
    } else if (response.data.status === '020') {
      throw new Error('API 키가 유효하지 않습니다. DART API 키를 확인해 주세요.');
    } else if (response.data.status === '100') {
      throw new Error('잘못된 API 요청입니다. 개발자에게 문의하세요.');
    } else {
      throw new Error(`DART API 오류(${response.data.status}): ${response.data.message}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes('자동으로 조회합니다')) {
      // Pass specific known errors through
      throw error; 
    }
    
    if (axios.isAxiosError(error)) {
      console.error('API 응답 오류:', error.response?.status, error.response?.data);
      // Customize error message based on status if needed
      throw new Error(`API 서버 오류 (${error.response?.status || 'N/A'})`);
    } else if (error instanceof Error) {
      console.error('재무제표 데이터 가져오기 오류:', error);
      // Re-throw the original error or a new one with the message
      throw error;
    } else {
      // Catch non-Error types being thrown
      console.error('알 수 없는 오류 타입:', error);
      throw new Error('재무제표 데이터 가져오기 중 알 수 없는 오류가 발생했습니다.');
    }
    // Note: All paths in this catch block now explicitly throw.
  }
  // This final throw should be unreachable if all paths above return or throw
  throw new Error('getFinancialStatements 함수가 예기치 않게 종료되었습니다.');
};

// 재무제표가 연결 재무제표인지 확인하는 함수
function checkIfConsolidated(data: DartRawItem[]): boolean {
  const consolidatedKeywords = ['연결', '연결재무상태표', '연결재무제표', '연결손익계산서'];
  
  if (data && data.length > 0) {
    // Remove 'as any' - DartRawItem now includes optional properties
    const firstItem = data[0]; 
    
    // Access optional properties safely
    if (firstItem.fs_div) {
      return firstItem.fs_div === 'CFS';
    }
    if (firstItem.fs_nm) {
      return consolidatedKeywords.some(keyword => firstItem.fs_nm?.includes(keyword)); // Add optional chaining for safety
    }
    if (firstItem.sj_nm) {
      return consolidatedKeywords.some(keyword => firstItem.sj_nm?.includes(keyword)); // Add optional chaining for safety
    }
    
    const totalAssetsItem = data.find(item => 
      item.account_nm === '자산총계' || 
      item.account_nm.includes('자산총계') ||
      item.account_nm.includes('자산 총계')
    ); // Remove 'as any'
    
    if (totalAssetsItem && totalAssetsItem.account_detail) {
      return consolidatedKeywords.some(keyword => totalAssetsItem.account_detail?.includes(keyword)); // Add optional chaining
    }
  }
  return false;
} 