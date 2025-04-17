import { Company } from '../db/models';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';

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

// 데이터 파일에서 회사 정보 로드
export const loadCompaniesFromFile = async (filePath: string) => {
  try {
    // JSON 파일 읽기
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 배치 처리를 위한 청크 크기 설정
    const chunkSize = 1000;
    
    // 데이터 배열을 청크로 분할
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      // 각 청크를 데이터베이스에 일괄 삽입
      await Company.bulkCreate(
        chunk.map((item: any) => ({
          corp_code: item.corp_code,
          corp_name: item.corp_name,
          stock_code: item.stock_code || null
        })),
        {
          updateOnDuplicate: ['corp_name', 'stock_code']
        }
      );
      
      console.log(`처리된 회사 수: ${i + chunk.length}/${data.length}`);
    }
    
    console.log('회사 데이터 로드 완료');
    
  } catch (error) {
    console.error('회사 데이터 로드 오류:', error);
    throw error;
  }
};

// DART API에서 재무제표 데이터 가져오기
export const getFinancialStatements = async (corpCode: string, year: string, reportCode: string): Promise<any> => {
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
      const isConsolidated = checkIfConsolidated(response.data.list);
      
      // 재무제표 종류를 응답에 포함하여 반환
      return {
        ...response.data,
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
  } catch (error: any) {
    // 이미 재귀 호출하는 경우의 오류는 그대로 전달
    if (error.message?.includes('자동으로 조회합니다')) {
      throw error;
    }
    
    // axios 오류와 일반 오류 구분
    if (error.response) {
      // API 서버에서 응답을 받았지만 2xx 상태 코드가 아님
      console.error('API 응답 오류:', error.response.status, error.response.data);
      throw new Error(`API 서버 오류 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없음
      console.error('API 요청 오류:', error.request);
      throw new Error('API 서버에서 응답이 없습니다. 네트워크 연결이나 서버 상태를 확인해 주세요.');
    } else if (error.code === 'ECONNABORTED') {
      // 타임아웃 오류
      console.error('API 요청 타임아웃:', error);
      throw new Error('API 요청 시간이 초과되었습니다. 나중에 다시 시도해 주세요.');
    } else {
      // 그 외 오류
      console.error('재무제표 데이터 가져오기 오류:', error);
      throw error;
    }
  }
};

// 재무제표가 연결 재무제표인지 확인하는 함수
function checkIfConsolidated(data: any[]): boolean {
  // 연결 재무제표 여부를 확인할 수 있는 키워드들
  const consolidatedKeywords = ['연결', '연결재무상태표', '연결재무제표', '연결손익계산서'];
  
  // 재무제표 데이터 내의 첫 번째 항목에서 보고서 구분 정보 확인
  if (data && data.length > 0) {
    // fs_div 필드가 있는 경우 이를 통해 확인 (CFS: 연결재무제표, OFS: 개별재무제표)
    if (data[0].fs_div) {
      return data[0].fs_div === 'CFS';
    }
    
    // fs_nm 필드를 통해 연결 재무제표 여부 확인
    if (data[0].fs_nm) {
      return consolidatedKeywords.some(keyword => data[0].fs_nm.includes(keyword));
    }
    
    // sj_nm 필드를 통해 연결 재무제표 여부 확인
    if (data[0].sj_nm) {
      return consolidatedKeywords.some(keyword => data[0].sj_nm.includes(keyword));
    }
    
    // 재무상태표 계정과목명에서 연결 재무제표 여부 확인
    const totalAssetsItem = data.find(item => 
      item.account_nm === '자산총계' || 
      item.account_nm.includes('자산총계') ||
      item.account_nm.includes('자산 총계')
    );
    
    if (totalAssetsItem && totalAssetsItem.account_detail) {
      return consolidatedKeywords.some(keyword => totalAssetsItem.account_detail.includes(keyword));
    }
  }
  
  // 기본적으로는 개별 재무제표로 간주
  return false;
} 