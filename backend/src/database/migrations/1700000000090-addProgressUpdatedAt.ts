import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProgressUpdatedAt1700000000090 implements MigrationInterface {
    name = 'AddProgressUpdatedAt1700000000090';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "progress"
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
    `);

        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_progress_updated_at" ON "progress"("updated_at")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_progress_updated_at"`);
        await queryRunner.query(`ALTER TABLE "progress" DROP COLUMN IF EXISTS "updated_at"`);
    }
}