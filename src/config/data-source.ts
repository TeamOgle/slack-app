import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { type DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const env = process.env.NODE_ENV || 'development';
const dotenv_path = `src/config/env/.${env}.env`;
dotenv.config({ path: dotenv_path });

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.ZETTEL_DB_HOST,
  port: 3306,
  username: process.env.ZETTEL_DB_USER,
  password: process.env.ZETTEL_DB_PASSWORD,
  database: process.env.ZETTEL_DB_NAME,
  entities: [`${__dirname}/../database/entities/*.entity{.ts,.js}`],
  synchronize: false,
  timezone: 'UTC',
  namingStrategy: new SnakeNamingStrategy(),
  migrations: [`${__dirname}/../database/migrations/*{.ts,.js}`],
  migrationsTableName: 'migrations',
};

export const AppDataSource = new DataSource(dataSourceOptions);
