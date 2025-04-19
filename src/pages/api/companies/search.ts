import type { NextApiRequest, NextApiResponse } from 'next';
// models.ts 파일을 불러오는 것 자체를 테스트하기 위해 import는 유지
import '@/lib/db/models'; // 경로가 정확한지 확인, sequelize 인스턴스를 직접 사용하지 않으므로 이름 없이 import 가능
// 실제 DB 사용을 위해 searchCompany import 주석 해제
import { searchCompany } from '@/lib/services/companyService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. 요청 수신 로그
  console.log('API /api/companies/search received request');

  // --- keyword 대신 query 사용 ---
  const { query } = req.query; // req.query에서 'query' 파라미터를 추출

  // 2. 검색어 확인 로그 (query 변수 사용)
  console.log('Search query:', query);

  if (!query || typeof query !== 'string') { // query 변수로 유효성 검사
    console.log('Invalid query');
    return res.status(400).json({ message: '검색어를 입력해주세요.' });
  }
  // --- 여기까지 query 정의 및 유효성 검사 ---

  try {
    console.log('!!! [API Handler Test] DB 관련 로직 실행 전 !!!');
    // DB 호출 주석 해제
    const companies = await searchCompany(query as string); // query를 string으로 타입 단언

    // 임시 응답 대신 실제 검색 결과 반환
    res.status(200).json({ companies });
    // console.log('!!! [API Handler Test] DB 관련 로직 실행 후, 결과 반환 !!!', companies); // 결과 로깅 (필요시)

    // 임시 응답 주석 처리 또는 삭제
    // res.status(200).json({ message: 'DB 로직 임시 비활성화됨', query });

  } catch (error: unknown) {
    console.error('Error in /api/companies/search handler:', error);

    // 에러 객체의 상세 정보 로깅 시도
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Caught a non-Error object:', error);
    }

    res.status(500).json({ message: '회사 검색 중 서버 오류가 발생했습니다.' });
  }
} 