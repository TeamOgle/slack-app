import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import slackConfig from './config/slack.config';
import { validationSchema } from './config/validation-schema';
import { SlackModule } from './slack/slack.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
      load: [slackConfig],
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.ZETTEL_DB_HOST,
      port: 3306,
      username: process.env.ZETTEL_DB_USER,
      password: process.env.ZETTEL_DB_PASSWORD,
      database: process.env.ZETTEL_DB_NAME,
      entities: [`${__dirname}/database/entities/*.entity{.ts,.js}`],
      // synchronize: process.env.NODE_ENV === 'development',
      synchronize: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    SlackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
