import { Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { SlackTeamEntity } from './slack-teams.entity';
import { TagEntity } from './tags.entity';
import { UserEntity } from './users.entity';

@Entity('teams')
export class TeamEntity extends CommonEntity {
  @OneToMany(() => UserEntity, (user: UserEntity) => user.team)
  users: UserEntity[];

  @OneToOne(() => SlackTeamEntity) // 단방향 연결, 양방향도 가능
  @JoinColumn({ name: 'slack_team_id', referencedColumnName: 'id' })
  slackTeam: SlackTeamEntity;

  @OneToMany(() => TagEntity, (tag: TagEntity) => tag.team)
  tags: TagEntity[];
}
