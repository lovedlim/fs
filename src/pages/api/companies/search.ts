import type { NextApiRequest, NextApiResponse } from 'next';
// models.ts 파일을 불러오는 것 자체를 테스트하기 위해 import는 유지
import '@/lib/db/models'; // 경로가 정확한지 확인, sequelize 인스턴스를 직접 사용하지 않으므로 이름 없이 import 가능
// import { searchCompany } from '@/lib/services/companyService'; // 실제 DB 사용은 주석 처리

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. 요청 수신 로그
  console.log('API /api/companies/search received request');

  // ... (기존 keyword 처리 등) ...

  try {
    console.log('!!! [API Handler Test] DB 관련 로직 실행 전 !!!');
    // const companies = await searchCompany(keyword); // DB 호출 주석 처리

    // 임시 응답
    res.status(200).json({ message: 'DB 로직 임시 비활성화됨', keyword });

  } catch (error: unknown) {
    // ... (기존 에러 처리) ...
    res.status(500).json({ message: '회사 검색 중 서버 오류가 발생했습니다.' });
  }
} 