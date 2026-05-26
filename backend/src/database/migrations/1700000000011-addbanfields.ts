import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBanFields1700000000011 implements MigrationInterface {
    name = 'AddBanFields1700000000011';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "banReason"  TEXT        DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "bannedAt"   TIMESTAMPTZ DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS "bannedBy"   UUID        DEFAULT NULL
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."notifications_type_enum"
            ADD VALUE IF NOT EXISTS 'account_banned'
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."notifications_type_enum"
            ADD VALUE IF NOT EXISTS 'account_unbanned'
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "banReason",
            DROP COLUMN IF EXISTS "bannedAt",
            DROP COLUMN IF EXISTS "bannedBy"
        `);

    }
}