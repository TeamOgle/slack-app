import { IsNotEmpty, IsUrl } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { LinkEntity } from './links.entity';
import { TeamEntity } from './teams.entity';

@Entity('tags')
export class TagEntity extends CommonEntity {
  @IsNotEmpty()
  @IsUrl()
  @Column({ type: 'varchar', unique: false, nullable: false })
  name: string;

  @ManyToOne(() => TeamEntity, (team: TeamEntity) => team.tags)
  @JoinColumn([
    // foreignkey 정보들
    {
      name: 'team_id' /* db에 저장되는 필드 이름 */,
      referencedColumnName: 'id',
    },
  ])
  team: TeamEntity;

  @ManyToMany(() => LinkEntity, (link: LinkEntity) => link.tags)
  links: LinkEntity[];
}
