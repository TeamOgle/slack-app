import { Exclude } from 'class-transformer';
import { IsULID } from 'src/common/decorators/is-ulid.decorator';
import { CreateDateColumn, DeleteDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export abstract class CommonEntity {
  @IsULID()
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
}
