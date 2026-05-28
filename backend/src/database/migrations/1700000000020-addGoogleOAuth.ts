import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleOAuth1700000000020 implements MigrationInterface {
    name = 'AddGoogleOAuth1700000000020';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "password" DROP NOT NULL
    `);

        await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "googleId" character varying UNIQUE
    `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "googleId"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
    }
}