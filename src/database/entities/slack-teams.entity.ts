import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SlackUserEntity } from './slack-users.entity';

@Entity('slack_teams')
export class SlackTeamEntity {
  @IsNotEmpty()
  @IsString()
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  // 해당 열이 추가된 시각을 자동으로 기록
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Soft Delete : 기존에는 null, 삭제시에 timestamp를 찍는다.
  @Exclude()
  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt?: Date | null;

  @IsNotEmpty()
  @IsString()
  @Column({ type: 'varchar', unique: false, nullable: false })
  name: string;

  @IsNotEmpty()
  @IsString()
  @Column({ type: 'varchar', unique: false, nullable: false })
  accessToken: string;

  @IsString()
  @Column({ type: 'varchar', unique: true, nullable: true })
  enterpriseId: string;

  @IsString()
  @Column({ type: 'varchar', unique: false, nullable: true })
  enterpriseName: string;

  @OneToMany(() => SlackUserEntity, (slackUser: SlackUserEntity) => slackUser.slackTeam)
  slackUsers: SlackUserEntity[];
}
