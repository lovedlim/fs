# 프로젝트 JJ (가칭)

기업 정보 검색 및 관련 기능을 제공하는 Next.js 기반 웹 애플리케이션입니다.

## 주요 기능

*   기업명 검색 API (`/api/companies/search`) 제공
*   (추가 기능은 여기에 기술)

## 기술 스택

*   **프레임워크:** [Next.js](https://nextjs.org/) (Pages Router 사용)
*   **데이터베이스:** [PostgreSQL](https://www.postgresql.org/)
*   **ORM:** [Sequelize](https://sequelize.org/)
*   **타입스크립트:** [TypeScript](https://www.typescriptlang.org/)
*   **스타일링:** [Tailwind CSS](https://tailwindcss.com/) (설정 파일 기준)
*   **API 클라이언트:** [Axios](https://axios-http.com/)
*   **기타:** Chart.js, OpenAI, React Markdown 등

## 시작하기

### 사전 요구 사항

*   [Node.js](https://nodejs.org/) (v18 이상 권장 - `package.json`의 `engines` 필드 참조)
*   [npm](https://www.npmjs.com/) 또는 [Yarn](https://yarnpkg.com/)
*   [PostgreSQL](https://www.postgresql.org/download/) 데이터베이스 서버

### 설치

1.  저장소를 클론합니다:
    ```bash
    git clone <저장소_URL>
    cd jj
    ```
2.  의존성을 설치합니다:
    ```bash
    npm install
    # 또는
    # yarn install
    ```

### 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다. 실제 운영 환경(예: Vercel)에서는 해당 플랫폼의 환경 변수 설정 기능을 사용하세요.

```dotenv:.env
# PostgreSQL 데이터베이스 연결 URL
DATABASE_URL=postgres://user:password@localhost:5432/database

# DART API 키
DART_API_KEY=your_dart_api_key

# OpenAI API 키 (AI 분석 기능 사용 시 필요)
OPENAI_API_KEY=your_openai_api_key
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
