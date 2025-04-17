# 재무제표 시각화 앱

이 애플리케이션은 DART(전자공시시스템) API를 사용하여 기업의 재무제표 데이터를 가져오고 시각화합니다.

## 주요 기능

- 회사 검색 및 선택
- 연도별 재무제표 데이터 조회
- 재무상태표 및 손익계산서 시각화
- 주요 재무비율 계산 및 표시
- AI 기반 재무제표 분석 (중학생도 이해할 수 있는 쉬운 설명)

## 설치 및 실행

1. 패키지 설치
```bash
npm install
```

2. 환경 변수 설정
`.env` 파일을 만들고 다음 내용을 추가합니다:
```
# DART API 키
DART_API_KEY=your_dart_api_key

# 데이터베이스 설정
DATABASE_URL=sqlite:./database.sqlite

# OpenAI API 키 (AI 분석 기능 사용 시 필요)
OPENAI_API_KEY=your_openai_api_key
```

3. 개발 서버 시작
```bash
npm run dev
```

## AI 분석 기능 (선택사항)

이 앱은 OpenAI API를 사용하여 기업의 재무제표를 중학생도 이해할 수 있는 쉬운 언어로 분석해주는 기능을 제공합니다. 이 기능을 사용하려면:

1. [OpenAI 웹사이트](https://platform.openai.com/)에서 API 키를 발급받습니다.
2. `.env` 파일에 `OPENAI_API_KEY` 값을 설정합니다.

AI 분석 기능은 선택 사항이며, API 키가 설정되지 않은 경우 AI 분석 섹션은 표시되지만 분석 결과는 제공되지 않습니다.

## 기술 스택

- Next.js: 프론트엔드 및 백엔드 프레임워크
- Tailwind CSS: UI 스타일링
- Chart.js: 데이터 시각화
- OpenAI API: 재무제표 AI 분석
- SQLite: 로컬 데이터베이스

## 기능

- 회사명으로 기업 검색
- DART API를 통한 재무제표 데이터 가져오기
- 재무상태표 및 손익계산서 시각화
- 주요 재무비율 계산 및 표시
- 다양한 차트를 통한 데이터 분석

## 시작하기

### 필수 조건

- Node.js 18 이상
- DART API 인증키 (https://opendart.fss.or.kr/)에서 발급

### 설치

1. 리포지토리 클론
```bash
git clone <repository-url>
cd <repository-name>
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
# .env 파일 생성
DART_API_KEY=your_api_key_here
DATABASE_URL=sqlite:./database.sqlite
```

4. 회사 데이터 로드
```bash
# 샘플 데이터 로드
npm run load-data

# 또는 실제 DART에서 제공하는 corpcode.xml 파일을 사용하여 로드
# 1. DART에서 corpcode.xml 파일 다운로드 (https://opendart.fss.or.kr/api/corpCode.xml)
# 2. 압축 해제 후 corpcode.xml 파일을 data/ 폴더에 복사
# 3. 아래 명령어 실행
npm run parse-xml
```

5. 개발 서버 실행
```bash
npm run dev
```

6. 브라우저에서 http://localhost:3000 접속

## 데이터베이스 구조

- **회사 정보 테이블**: 회사 코드, 회사명, 주식 코드 등의 정보 저장

## API 엔드포인트

- **GET /api/companies/search**: 회사명으로 회사 검색
- **GET /api/financial**: 특정 기업의 재무제표 데이터 조회

## corpcode.xml 파일 사용하기

DART API에서 제공하는 corpcode.xml 파일을 사용하여 전체 회사 정보를 데이터베이스에 로드할 수 있습니다.

1. DART 오픈 API 서비스(https://opendart.fss.or.kr)에서 API 키 발급
2. 다음 URL에서 회사 코드 파일 다운로드: `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key={발급받은 API 키}`
3. 다운로드 받은 파일 압축 해제 후 corpcode.xml 파일을 data/ 폴더에 복사
4. `npm run parse-xml` 명령어 실행하여 데이터베이스에 회사 정보 로드

## 라이센스

MIT
