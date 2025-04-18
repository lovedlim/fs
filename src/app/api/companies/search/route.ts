import { NextRequest, NextResponse } from 'next/server';
import { searchCompany } from '@/lib/services/companyService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    
    if (!query) {
      return NextResponse.json({ error: '검색어를 입력하세요' }, { status: 400 });
    }
    
    const companies = await searchCompany(query);
    
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('회사 검색 오류:', error);
    return NextResponse.json({ error: '회사 검색 중 오류가 발생했습니다' }, { status: 500 });
  }
} 