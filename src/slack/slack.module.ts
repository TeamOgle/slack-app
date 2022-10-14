import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlackUserEntity, SlackTeamEntity, UserEntity, TeamEntity } from 'src/database/entities';
import { TagEntity } from '../database/entities/tags.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SlackUserEntity, SlackTeamEntity, UserEntity, TeamEntity, TagEntity]),
  ],
  providers: [SlackService],
  exports: [SlackService],
  controllers: [SlackController],
})
export class SlackModule {}
