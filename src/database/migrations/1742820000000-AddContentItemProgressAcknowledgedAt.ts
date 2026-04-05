import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 3.3 Phase 3 — acknowledge non-video (and no-duration video) required items.
 */
export class AddContentItemProgressAcknowledgedAt1742820000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE content_item_progress
      ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE content_item_progress
      DROP COLUMN IF EXISTS acknowledged_at
    `);
  }
}
