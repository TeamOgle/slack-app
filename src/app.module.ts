import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import slackConfig from './config/slack.config';
import { validationSchema } from './config/validation-schema';
import { SlackModule } from './slack/slack.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
      load: [slackConfig],
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    SlackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
