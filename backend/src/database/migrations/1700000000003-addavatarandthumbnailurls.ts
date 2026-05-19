import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvatarAndThumbnailUrls1700000000003 implements MigrationInterface {
    name = 'AddAvatarAndThumbnailUrls1700000000003';

    public async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "avatarUrl" character varying NULL
    `);
        await qr.query(`
      ALTER TABLE "courses"
      ADD COLUMN IF NOT EXISTS "thumbnailUrl" character varying NULL
    `);
    }

    public async down(qr: QueryRunner): Promise<void> {
        await qr.query(`ALTER TABLE "users"   DROP COLUMN IF EXISTS "avatarUrl"`);
        await qr.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "thumbnailUrl"`);
    }
}