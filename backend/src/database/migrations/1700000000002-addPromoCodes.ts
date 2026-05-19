import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromoCodes1700000000002 implements MigrationInterface {
    name = 'AddPromoCodes1700000000002';

    public async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
      CREATE TYPE "promo_code_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);

        await qr.query(`
      CREATE TABLE "promo_codes" (
        "id"               uuid                       NOT NULL DEFAULT uuid_generate_v4(),
        "code"             character varying          NOT NULL,
        "discount_percent" integer                    NOT NULL,
        "course_id"        uuid                       NOT NULL,
        "teacher_id"       uuid                       NOT NULL,
        "status"           "promo_code_status_enum"   NOT NULL DEFAULT 'pending',
        "expires_at"       TIMESTAMP                  NULL,
        "usage_limit"      integer                    NULL,
        "used_count"       integer                    NOT NULL DEFAULT 0,
        "admin_comment"    text                       NULL,
        "created_at"       TIMESTAMP                  NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP                  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_promo_codes"        PRIMARY KEY ("id"),
        CONSTRAINT "UQ_promo_codes_code"   UNIQUE ("code"),
        CONSTRAINT "FK_promo_codes_course" FOREIGN KEY ("course_id")
          REFERENCES "courses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_promo_codes_teacher" FOREIGN KEY ("teacher_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

        await qr.query(`CREATE INDEX "IDX_promo_codes_course_id" ON "promo_codes" ("course_id")`);
        await qr.query(`CREATE INDEX "IDX_promo_codes_teacher_id" ON "promo_codes" ("teacher_id")`);
        await qr.query(`CREATE INDEX "IDX_promo_codes_status" ON "promo_codes" ("status")`);

        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'promo_code_pending'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'promo_code_approved'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'promo_code_rejected'`);
    }

    public async down(qr: QueryRunner): Promise<void> {
        await qr.query(`DROP TABLE "promo_codes"`);
        await qr.query(`DROP TYPE "promo_code_status_enum"`);
    }
}