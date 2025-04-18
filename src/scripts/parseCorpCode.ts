import fs from 'fs';
import path from 'path';
import { parseString } from 'xml2js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Add .js extension to relative imports for Node ESM compatibility
import { syncDatabase } from '../lib/db/models.js';
import { loadCompaniesFromFile } from '../lib/services/companyService.js';

// Define interface for the parsed company data
interface CompanyData {
  corp_code: string;
  corp_name: string;
  stock_code: string | null;
}

// Define a simplified interface for the xml2js result structure
interface XmlListItem {
  corp_code: string[];
  corp_name: string[];
  stock_code: string[];
}
interface XmlResult {
  result: {
    list: XmlListItem[];
  };
}

// XML 파일 파싱 함수
async function parseCorpCodeXML(xmlFilePath: string): Promise<CompanyData[]> {
  return new Promise((resolve, reject) => {
    const xmlData = fs.readFileSync(xmlFilePath, 'utf-8');
    
    parseString(xmlData, (err: Error | null, result: XmlResult) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        // 회사 목록 추출
        const companies: CompanyData[] = result.result.list.map((item: XmlListItem) => {
          return {
            corp_code: item.corp_code[0],
            corp_name: item.corp_name[0],
            stock_code: item.stock_code[0]?.trim() ? item.stock_code[0].trim() : null
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
    // 데이터베이스 초기화 (테이블 생성/동기화)
    console.log('데이터베이스 동기화 시작...');
    await syncDatabase();
    console.log('데이터베이스 동기화 완료.');
    
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