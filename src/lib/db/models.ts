// --- 모듈 로딩 테스트 로그 ---
// console.log('!!! [DB Models Test] src/lib/db/models.ts 파일 로딩 시도 !!!');


// 기존 코드는 모두 주석 처리
import { Sequelize, DataTypes, Model } from 'sequelize';

// --- 상세 로깅 추가 ---
// console.log('[DB Init] Loading db/models.ts module...');

// Use DATABASE_URL environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[DB Init] FATAL: DATABASE_URL environment variable is not set.'); // 에러 로그 강화
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
} else {
  // 중요: 실제 URL 로그는 보안상 주의. 앞부분만 로깅하거나, 존재 여부만 로깅.
  // console.log('[DB Init] DATABASE_URL is set.');
}

let sequelize: Sequelize;

try {
  // --- Sequelize 인스턴스 생성 로깅 및 에러 핸들링 강화 ---
  // console.log('[DB Init] Attempting to create Sequelize instance...');
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    // --- 디버깅을 위해 로깅 활성화 ---
    logging: console.log, // DB 쿼리 및 내부 동작 로깅 (문제 해결 후 false로 변경 권장)
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: false,
      underscored: true
    },
    // --- 서버리스 환경을 위한 풀 설정 (선택 사항) ---
    pool: {
      max: 5, // 동시에 유지할 최대 커넥션 수
      min: 0, // 최소 커넥션 수
      acquire: 30000, // 커넥션 얻기 시도 타임아웃 (ms)
      idle: 10000 // 커넥션 유지 시간 (ms)
    }
  });
  // console.log('[DB Init] Sequelize instance created successfully.');

  // --- 연결 테스트 (선택 사항, 디버깅에 유용) ---
  // sequelize.authenticate()
  //   .then(() => console.log('[DB Init] Database connection authenticated successfully.'))
  //   .catch(err => console.error('[DB Init] !!! Unable to authenticate database connection:', err));

} catch (error) {
  console.error('[DB Init] !!! Failed to create Sequelize instance:', error); // 에러 발생 시 상세 로그
  // 에러를 다시 던져서 Vercel 로그에 명확히 표시되도록 함
  throw error;
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