import { Company } from '../db/models';
import axios from 'axios';
import fs from 'fs';
import { Op } from 'sequelize';
import { Company as CompanyType } from '@/types/financial';
import { DartRawItem, DartApiResponse } from '@/lib/utils/financialUtils';

// 회사 검색 함수
export const searchCompany = async (keyword: string) => {
  // SQLite에서는 LIKE가 case-sensitive일 수 있으므로 다양한 검색 조건 추가
  return await Company.findAll({
    where: {
      [Op.or]: [
        {
          corp_name: {
            [Op.like]: `%${keyword}%`
          }
        },
        {
          corp_name: {
            [Op.like]: `%${keyword.toUpperCase()}%`
          }
        },
        {
          corp_name: {
            [Op.like]: `%${keyword.toLowerCase()}%`
          }
        }
      ]
    },
    limit: 20
  });
};

// 회사 정보를 파일에서 로드하여 DB에 저장
export async function loadCompaniesFromFile(filePath: string): Promise<void> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    // Type the parsed data using CompanyType array
    const data: CompanyType[] = JSON.parse(fileContent);
    
    console.log(`파일에서 ${data.length}개 회사 정보 로드 완료`);

    // 각 회사 정보에 대해 DB 작업 수행
    for (const companyData of data) {
      await Company.upsert({
        corp_code: companyData.corp_code,
        corp_name: companyData.corp_name,
        stock_code: companyData.stock_code,
      });
    }
    
    console.log(`${data.length}개 회사 정보 DB 저장/업데이트 완료`);
  } catch (error) {
    console.error('파일에서 회사 정보 로드 중 오류:', error);
    throw error;
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
    console.log(`API 응답 상태: ${response.data.status}, 메시지: ${response.data.message}`);
    
    if (response.data.status === '000') {
      if (!response.data.list || response.data.list.length === 0) {
        throw new Error(`해당 연도(${year})의 재무제표 데이터가 존재하지 않습니다. 다른 연도를 선택하세요.`);
      }
      
      // 재무제표 종류 확인 (연결 재무제표인지 개별 재무제표인지)
      const isConsolidated = checkIfConsolidated(response.data.list as DartRawItem[]);
      
      // 재무제표 종류를 응답에 포함하여 반환
      return {
        list: response.data.list as DartRawItem[],
        isConsolidated
      };
    } else if (response.data.status === '013') {
      // 조회된 데이터가 없는 경우 (일반적으로 발생하는 오류)
      
      // 현재 연도에 대한 데이터가 없고, 당해년도인 경우 전년도 데이터 자동 조회
      const currentYear = new Date().getFullYear().toString();
      if (year === currentYear || parseInt(year) > parseInt(currentYear)) {
        console.log(`${year}년 데이터가 없어 ${parseInt(year) - 1}년 데이터를 자동으로 조회합니다.`);
        
        // 재귀적으로 전년도 데이터 조회
        return getFinancialStatements(corpCode, (parseInt(year) - 1).toString(), reportCode);
      }
      
      throw new Error(`해당 연도(${year})의 재무제표 데이터가 없습니다. 다른 연도를 선택해 주세요.`);
    } else if (response.data.status === '020') {
      throw new Error('API 키가 유효하지 않습니다. DART API 키를 확인해 주세요.');
    } else if (response.data.status === '100') {
      throw new Error('잘못된 API 요청입니다. 개발자에게 문의하세요.');
    } else {
      throw new Error(`API 오류(${response.data.status}): ${response.data.message}`);
    }
  } catch (error: unknown) {
    // 이미 재귀 호출하는 경우의 오류는 그대로 전달
    if (error instanceof Error && error.message?.includes('자동으로 조회합니다')) {
      throw error;
    }
    
    // axios 오류와 일반 오류 구분
    if (axios.isAxiosError(error)) {
      // API 서버에서 응답을 받았지만 2xx 상태 코드가 아님
      console.error('API 응답 오류:', error.response?.status, error.response?.data);
      throw new Error(`API 서버 오류 (${error.response?.status})`);
    } else if (error instanceof Error) {
      // 그 외 오류
      console.error('재무제표 데이터 가져오기 오류:', error);
      throw error;
    }
  }
};

// 재무제표가 연결 재무제표인지 확인하는 함수
function checkIfConsolidated(data: DartRawItem[]): boolean {
  // 연결 재무제표 여부를 확인할 수 있는 키워드들
  const consolidatedKeywords = ['연결', '연결재무상태표', '연결재무제표', '연결손익계산서'];
  
  // 재무제표 데이터 내의 첫 번째 항목에서 보고서 구분 정보 확인
  if (data && data.length > 0) {
    // fs_div 필드가 있는 경우 이를 통해 확인 (CFS: 연결재무제표, OFS: 개별재무제표)
    const firstItem = data[0] as any; // Temporary any for potentially missing props
    if (firstItem.fs_div) {
      return firstItem.fs_div === 'CFS';
    }
    
    // fs_nm 필드를 통해 연결 재무제표 여부 확인
    if (firstItem.fs_nm) {
      return consolidatedKeywords.some(keyword => firstItem.fs_nm.includes(keyword));
    }
    
    // sj_nm 필드를 통해 연결 재무제표 여부 확인
    if (firstItem.sj_nm) {
      return consolidatedKeywords.some(keyword => firstItem.sj_nm.includes(keyword));
    }
    
    // 재무상태표 계정과목명에서 연결 재무제표 여부 확인
    const totalAssetsItem = data.find(item => 
      item.account_nm === '자산총계' || 
      item.account_nm.includes('자산총계') ||
      item.account_nm.includes('자산 총계')
    ) as any; // Temporary any
    
    if (totalAssetsItem && totalAssetsItem.account_detail) {
      return consolidatedKeywords.some(keyword => totalAssetsItem.account_detail.includes(keyword));
    }
  }
  
  // 기본적으로는 개별 재무제표로 간주
  return false;
} 