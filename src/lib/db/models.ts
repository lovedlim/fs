import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';

// 데이터베이스 연결 설정
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'database.sqlite'),
  logging: false
});

// 회사 정보 모델
export class Company extends Model {
  declare id: number;
  declare corp_code: string;
  declare corp_name: string;
  declare stock_code: string;
}

Company.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  corp_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  corp_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stock_code: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Company',
  timestamps: true
});

// 데이터베이스 동기화 함수
export const syncDatabase = async () => {
  try {
    await sequelize.sync();
    console.log('데이터베이스 동기화 완료');
  } catch (error) {
    console.error('데이터베이스 동기화 오류:', error);
  }
};

export default sequelize; 