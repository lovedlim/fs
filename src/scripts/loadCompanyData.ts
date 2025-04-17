import path from 'path';
import fs from 'fs';
import { syncDatabase } from '../lib/db/models';
import { loadCompaniesFromFile } from '../lib/services/companyService';

// 회사 정보 로드 스크립트
async function loadCompanyData() {
  try {
    // 데이터베이스 동기화
    await syncDatabase();
    
    // 회사 데이터 파일 경로
    const dataDir = path.join(process.cwd(), 'data');
    const dataFile = path.join(dataDir, 'companies.json');
    
    // 데이터 디렉토리 확인
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // 임시 데이터 생성 (실제로는 파일에서 데이터 로드)
    if (!fs.existsSync(dataFile)) {
      // 샘플 데이터 생성
      const sampleData = [
        { corp_code: '00126380', corp_name: '삼성전자', stock_code: '005930' },
        { corp_code: '00164742', corp_name: '아모레퍼시픽', stock_code: '090430' },
        { corp_code: '00164779', corp_name: '아모레퍼시픽그룹', stock_code: '002790' },
        { corp_code: '00258801', corp_name: '카카오', stock_code: '035720' },
        { corp_code: '00164779', corp_name: '네이버', stock_code: '035420' },
      ];
      
      // 데이터 파일 생성
      fs.writeFileSync(dataFile, JSON.stringify(sampleData, null, 2));
      console.log('샘플 데이터 파일 생성됨');
    }
    
    // 데이터베이스에 회사 정보 로드
    await loadCompaniesFromFile(dataFile);
    
    console.log('회사 데이터 로드 완료');
  } catch (error) {
    console.error('회사 데이터 로드 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
loadCompanyData(); 