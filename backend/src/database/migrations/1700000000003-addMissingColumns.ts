import { MigrationInterface, QueryRunner } from 'typeorm';
export class AddMissingColumns1700000000003 implements MigrationInterface {
    name = 'AddMissingColumns1700000000003';

    public async up(qr: QueryRunner): Promise<void> {

        await qr.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "avatarUrl"  character varying            NULL,
        ADD COLUMN IF NOT EXISTS "isActive"   boolean NOT NULL DEFAULT true
    `);

        await qr.query(`
      DO $$ BEGIN
        CREATE TYPE "course_status_enum" AS ENUM ('draft', 'published', 'archived');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
        await qr.query(`
      DO $$ BEGIN
        CREATE TYPE "course_level_enum" AS ENUM ('beginner', 'intermediate', 'advanced');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

        await qr.query(`
      ALTER TABLE "courses"
        ADD COLUMN IF NOT EXISTS "thumbnailUrl" character varying                                    NULL,
        ADD COLUMN IF NOT EXISTS "status"       "course_status_enum" NOT NULL DEFAULT 'draft',
        ADD COLUMN IF NOT EXISTS "level"        "course_level_enum"  NOT NULL DEFAULT 'beginner',
        ADD COLUMN IF NOT EXISTS "category"     character varying                                    NULL,
        ADD COLUMN IF NOT EXISTS "rating"       numeric(3,2)                  DEFAULT 0              NULL
    `);

        await qr.query(`
      DO $$ BEGIN
        CREATE TYPE "lesson_type_enum" AS ENUM ('video', 'text', 'quiz');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

        await qr.query(`
      ALTER TABLE "lessons"
        ADD COLUMN IF NOT EXISTS "type"        "lesson_type_enum" NOT NULL DEFAULT 'video',
        ADD COLUMN IF NOT EXISTS "contentUrl"  character varying                         NULL,
        ADD COLUMN IF NOT EXISTS "textContent" text                                      NULL,
        ADD COLUMN IF NOT EXISTS "durationSec" integer           NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "orderIndex"  integer           NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "isFree"      boolean           NOT NULL DEFAULT false
    `);

        await qr.query(`
      ALTER TABLE "modules"
        ADD COLUMN IF NOT EXISTS "orderIndex" integer NOT NULL DEFAULT 0
    `);

        await qr.query(`
      ALTER TABLE "enrollments"
        ADD COLUMN IF NOT EXISTS "paidPrice" numeric(8,2) NOT NULL DEFAULT 0
    `);

        await qr.query(`
      ALTER TABLE "progress"
        ADD COLUMN IF NOT EXISTS "completed"  boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "watchedSec" integer NOT NULL DEFAULT 0
    `);

        await qr.query(`
      ALTER TABLE "certificates"
        ADD COLUMN IF NOT EXISTS "pdfUrl" character varying NULL
    `);

        await qr.query(`
      ALTER TABLE "reviews"
        ADD COLUMN IF NOT EXISTS "isApproved" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "body"       text                         NULL
    `);

        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'course_pending_review'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'new_user_registered'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'course_approved'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'course_rejected'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'enrollment_confirmed'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'new_course_available'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'course_status_changed'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'new_enrollment'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'promo_code_pending'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'promo_code_approved'`);
        await qr.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'promo_code_rejected'`);

        await qr.query(`
      ALTER TABLE "notifications"
        ADD COLUMN IF NOT EXISTS "meta" jsonb NULL
    `);
    }

    public async down(qr: QueryRunner): Promise<void> {

        await qr.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "avatarUrl"`);
        await qr.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "isActive"`);

        await qr.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "thumbnailUrl"`);
        await qr.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "status"`);
        await qr.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "level"`);
        await qr.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "category"`);
        await qr.query(`ALTER TABLE "courses" DROP COLUMN IF EXISTS "rating"`);

        await qr.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "type"`);
        await qr.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "contentUrl"`);
        await qr.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "textContent"`);
        await qr.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "durationSec"`);
        await qr.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "orderIndex"`);
        await qr.query(`ALTER TABLE "lessons" DROP COLUMN IF EXISTS "isFree"`);

        await qr.query(`ALTER TABLE "modules" DROP COLUMN IF EXISTS "orderIndex"`);

        await qr.query(`ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "paidPrice"`);

        await qr.query(`ALTER TABLE "progress" DROP COLUMN IF EXISTS "completed"`);
        await qr.query(`ALTER TABLE "progress" DROP COLUMN IF EXISTS "watchedSec"`);

        await qr.query(`ALTER TABLE "certificates" DROP COLUMN IF EXISTS "pdfUrl"`);

        await qr.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "isApproved"`);
        await qr.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "body"`);

        await qr.query(`ALTER TABLE "notifications" DROP COLUMN IF EXISTS "meta"`);
    }
}