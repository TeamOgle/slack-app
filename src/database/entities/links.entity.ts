import { IsNotEmpty, IsUrl } from 'class-validator';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';
import { CommonEntity } from './common.entity';
import { UserEntity } from './users.entity';
import { TagEntity } from './tags.entity';

@Entity('links')
export class LinkEntity extends CommonEntity {
  @IsNotEmpty()
  @IsUrl()
  @Column({ type: 'varchar', length: 500, unique: false, nullable: false })
  url: string;

  @IsNotEmpty()
  @IsUrl()
  @Column({ type: 'text', unique: false, nullable: false })
  content: string;

  @ManyToOne(() => UserEntity, (sharingUser: UserEntity) => sharingUser.sharingLinks)
  @JoinColumn([
    // foreignkey 정보들
    {
      name: 'sharing_user_id' /* db에 저장되는 필드 이름 */,
      referencedColumnName: 'id' /* USER의 id */,
    },
  ])
  sharingUser: UserEntity;

  @ManyToMany(() => UserEntity, (sharedUser: UserEntity) => sharedUser.sharedLinks)
  sharedUsers: UserEntity[];

  @ManyToMany(() => TagEntity, (tag: TagEntity) => tag.links)
  @JoinTable({
    // table
    name: 'link_tags',
    joinColumn: {
      name: 'link_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tag_id',
      referencedColumnName: 'id',
    },
  })
  tags: TagEntity[];
}
