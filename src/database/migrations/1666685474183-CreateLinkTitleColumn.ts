import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CreateLinkTitleColumn1666685474183 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'links',
      new TableColumn({
        name: 'title',
        type: 'varchar',
        length: '50',
        isUnique: false,
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('links', 'title');
  }
}
