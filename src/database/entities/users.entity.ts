import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CommonEntity } from './common.entity';
import { SlackUserEntity } from './slack-users.entity';
import { LinkEntity } from './links.entity';
import { TeamEntity } from './teams.entity';
import { IsString } from 'class-validator';

@Entity('users')
export class UserEntity extends CommonEntity {
  @IsString()
  @Column({ nullable: true })
  slackUserId?: string;

  @IsString()
  @Column({ nullable: true })
  teamId?: string;

  @ManyToOne(() => TeamEntity, (team: TeamEntity) => team.users)
  @JoinColumn([
    // foreignkey 정보들
    {
      name: 'team_id' /* db에 저장되는 필드 이름 */,
      referencedColumnName: 'id',
    },
  ])
  team: TeamEntity;

  @OneToOne(() => SlackUserEntity) // 단방향 연결, 양방향도 가능
  @JoinColumn({ name: 'slack_user_id', referencedColumnName: 'id' })
  slackUser: SlackUserEntity;

  @OneToMany(() => LinkEntity, (link: LinkEntity) => link.sharingUser)
  sharingLinks: LinkEntity[];

  @ManyToMany(() => LinkEntity, (sharedLink: LinkEntity) => sharedLink.sharedUsers)
  @JoinTable({
    // table
    name: 'shared_links',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'link_id',
      referencedColumnName: 'id',
    },
  })
  sharedLinks: LinkEntity[];
}
