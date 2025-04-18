import { Sequelize, DataTypes, Model } from 'sequelize';

// Use DATABASE_URL environment variable
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
}

// Configure Sequelize to use PostgreSQL and the DATABASE_URL
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres', // Set dialect to postgres
  logging: false, // Disable logging or set to console.log for debugging
  // Add SSL configuration required by Neon (and typically other cloud providers)
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Adjust depending on your CA setup, false is common for cloud DBs
    }
  },
  // Define common options for models
  define: {
    timestamps: false, // Assuming you don't need createdAt/updatedAt
    underscored: true // If your table/column names use underscores
  }
});

// 회사 정보 모델
export class Company extends Model {
  public id!: number;
  public corp_code!: string;
  public corp_name!: string;
  public stock_code!: string | null;
}

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
  tableName: 'companies' // Ensure this matches your table name
});

// Sync database function (potentially adjust options)
export const syncDatabase = async () => {
  try {
    // Use { alter: true } carefully in production, consider migrations instead
    await sequelize.sync({ alter: true }); 
    console.log('데이터베이스 동기화 완료.');
  } catch (error) {
    console.error('데이터베이스 동기화 오류:', error);
    throw error;
  }
};

export default sequelize; 