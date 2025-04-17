import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import { syncDatabase } from '../lib/db/models';
import { loadCompaniesFromFile } from '../lib/services/companyService';

// XML 파일 파싱 함수
async function parseCorpCodeXML(xmlFilePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const xmlData = fs.readFileSync(xmlFilePath, 'utf-8');
    
    parseString(xmlData, (err: Error | null, result: any) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        // 회사 목록 추출
        const companies = result.result.list.map((item: any) => {
          return {
            corp_code: item.corp_code[0],
            corp_name: item.corp_name[0],
            stock_code: item.stock_code[0] !== ' ' ? item.stock_code[0] : null
          };
        });
        
        resolve(companies);
      } catch (error) {
        reject(error);
      }
    });
  });
}

// 메인 함수
async function processCorpCodeXML() {
  try {
    // 데이터베이스 초기화
    await syncDatabase();
    
    // XML 파일 경로
    const dataDir = path.join(process.cwd(), 'data');
    
    // 대소문자 구분 없이 XML 파일 찾기
    let xmlFilePath = '';
    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      if (file.toLowerCase() === 'corpcode.xml') {
        xmlFilePath = path.join(dataDir, file);
        break;
      }
    }
    
    if (!xmlFilePath) {
      console.error('corpcode.xml 파일이 없습니다. data 디렉토리에 파일을 위치시켜주세요.');
      process.exit(1);
    }
    
    const jsonFilePath = path.join(dataDir, 'companies.json');
    
    console.log('XML 파일 파싱 중...', xmlFilePath);
    const companies = await parseCorpCodeXML(xmlFilePath);
    console.log(`총 ${companies.length}개 회사 정보 파싱 완료`);
    
    // JSON 파일로 저장
    fs.writeFileSync(jsonFilePath, JSON.stringify(companies, null, 2));
    console.log(`회사 정보를 ${jsonFilePath}에 저장했습니다.`);
    
    // 데이터베이스에 저장
    console.log('데이터베이스에 회사 정보 저장 중...');
    await loadCompaniesFromFile(jsonFilePath);
    console.log('회사 정보 데이터베이스 저장 완료');
    
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
processCorpCodeXML(); 