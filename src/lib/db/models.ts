// --- 모듈 로딩 테스트 로그 ---
// console.log('!!! [DB Models Test] src/lib/db/models.ts 파일 로딩 시도 !!!');


// 기존 코드는 모두 주석 처리
import { Sequelize, DataTypes, Model } from 'sequelize';
// pg는 조건부로 import

// --- 상세 로깅 추가 ---
// console.log('[DB Init] Loading db/models.ts module...');

// Use DATABASE_URL environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[DB Init] FATAL: DATABASE_URL environment variable is not set.');
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

// 환경에 따라 다른 데이터베이스 사용
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;
try {
  // pg 모듈을 동적으로 로드
  const pg = require('pg');
  
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    define: {
      timestamps: false,
      underscored: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
  console.log('[DB Init] Sequelize instance created successfully with PostgreSQL.');
} catch (error) {
  console.error('[DB Init] Failed with PostgreSQL, falling back to SQLite:', error);
  
  // PostgreSQL 연결 실패 시 SQLite로 폴백
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: '/tmp/database.sqlite',
    logging: false
  });
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
    sequelize,
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
    await sequelize.sync({ alter: true });
    // console.log('[DB Sync] Database synchronization completed.');
  } catch (error) {
    console.error('[DB Sync] !!! Database synchronization error:', error);
    throw error;
  }
};

// --- 모듈 로드 완료 로그 ---
// console.log('[DB Init] db/models.ts module loaded successfully.');

export default sequelize;

// 임시 export (파일이 비어있지 않도록) 삭제
// export const tempExport = {}; 