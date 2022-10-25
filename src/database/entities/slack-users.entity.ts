import { Exclude } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SlackTeamEntity } from './slack-teams.entity';

@Entity('slack_users')
export class SlackUserEntity {
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
  @IsEmail()
  @Column({ type: 'varchar', length: 320, unique: true, nullable: false })
  email: string;

  @IsString()
  @Column({ type: 'varchar', unique: false, nullable: true })
  name?: string;

  @IsString()
  @Column({ type: 'varchar', unique: false, nullable: true })
  realName?: string;

  @ManyToOne(() => SlackTeamEntity, (slackTeam: SlackTeamEntity) => slackTeam.slackUsers)
  @JoinColumn([
    // foreignkey 정보들
    {
      name: 'slack_team_id' /* db에 저장되는 필드 이름 */,
      referencedColumnName: 'id',
    },
  ])
  slackTeam: SlackTeamEntity;
}
