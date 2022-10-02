import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import slackConfig from './config/slack.config';
import { validationSchema } from './config/validationSchema';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/config/env/.${process.env.NODE_ENV}.env`],
      load: [slackConfig],
      isGlobal: true,
      validationSchema,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
