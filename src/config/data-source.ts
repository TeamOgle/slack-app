import * as dotenv from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config({
  path:
    process.env.NODE_ENV === 'production'
      ? 'src/config/env/.production.env'
      : process.env.NODE_ENV === 'stage'
      ? 'src/config/env/.stage.env'
      : 'src/config/env/.development.env',
});

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
