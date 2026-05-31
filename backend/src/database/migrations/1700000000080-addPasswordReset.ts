import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordReset1700000000080 implements MigrationInterface {
    async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "resetPasswordToken"   TEXT        DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMPTZ DEFAULT NULL;
    `);
    }

    async down(qr: QueryRunner): Promise<void> {
        await qr.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "resetPasswordToken",
        DROP COLUMN IF EXISTS "resetPasswordExpires";
    `);
    }
}