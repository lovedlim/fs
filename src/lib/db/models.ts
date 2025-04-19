// --- 모듈 로딩 테스트 로그 ---
// console.log('!!! [DB Models Test] src/lib/db/models.ts 파일 로딩 시도 !!!');

// 기존 코드는 모두 주석 처리
import { Sequelize, DataTypes, Model } from 'sequelize';
// ESLint 규칙 비활성화
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
import pg from 'pg';

// --- 상세 로깅 추가 ---
// console.log('[DB Init] Loading db/models.ts module...');

// Use DATABASE_URL environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[DB Init] FATAL: DATABASE_URL environment variable is not set.');
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

let sequelize;
try {
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Vercel Postgres 등 외부 DB 연결 시 필요할 수 있음
      }
    },
    // 프로덕션에서는 로깅 비활성화, 개발 중에는 활성화
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    define: {
      timestamps: false,
      underscored: true
    },
    pool: { // 서버리스 환경 고려한 풀 설정
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  console.log('[DB Init] Sequelize instance created successfully with PostgreSQL.');

  // --- 연결 테스트 (선택 사항, 디버깅에 유용) ---
  // sequelize.authenticate()
  //   .then(() => console.log('[DB Init] Database connection authenticated successfully.'))
  //   .catch(err => console.error('[DB Init] !!! Unable to authenticate database connection:', err));

} catch (error) {
  console.error('[DB Init] Failed to initialize Sequelize with PostgreSQL:', error);
  // 필요하다면 여기서 SQLite 폴백 로직을 유지하거나, 에러를 다시 던질 수 있습니다.
  // 현재는 에러를 다시 던져서 문제를 명확히 인지하도록 합니다.
  throw error;
  /*
  // PostgreSQL 연결 실패 시 SQLite로 폴백 (선택적)
  console.warn('[DB Init] Falling back to SQLite due to PostgreSQL connection failure.');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '/tmp/database.sqlite', // Vercel 임시 저장 공간 사용
    logging: false
  });
  */
}

// 회사 정보 모델
export class Company extends Model {
  public id!: number;
  public corp_code!: string;
  public corp_name!: string;
  public stock_code!: string | null;
}

// --- 모델 초기화 로깅 추가 ---
try {
  // console.log('[DB Init] Initializing Company model...');
  Company.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    corp_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    corp_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stock_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize, // 위에서 생성된 sequelize 인스턴스 사용
    modelName: 'Company',
    tableName: 'companies'
  });
  // console.log('[DB Init] Company model initialized successfully.');
} catch (error) {
  console.error('[DB Init] !!! Failed to initialize Company model:', error); // 모델 초기화 에러 로그
  throw error;
}

// Sync database function (사용 주의!)
export const syncDatabase = async () => {
  // --- sync 함수 호출 로깅 추가 ---
  // console.warn('[DB Sync] syncDatabase function called. Using { alter: true }. Use with caution in production!');
  try {
    // sequelize 인스턴스가 정의되었는지 확인 후 sync 호출
    if (sequelize) {
      await sequelize.sync({ alter: true });
      // console.log('[DB Sync] Database synchronization completed.');
    } else {
      console.error('[DB Sync] !!! Sequelize instance is not available for sync.');
    }
  } catch (error) {
    console.error('[DB Sync] !!! Database synchronization error:', error);
    throw error;
  }
};

// --- 모듈 로드 완료 로그 ---
// console.log('[DB Init] db/models.ts module loaded successfully.');

// sequelize 인스턴스를 기본 export로 내보냄
export default sequelize;

// 임시 코드는 제거
// const placeholder = 'test';
// export default placeholder;
// export class Company {} // 임시 클래스 정의
// export const syncDatabase = async () => {}; // 임시 함수 정의 