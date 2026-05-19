import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1700000000001 implements MigrationInterface {
    name = 'AddNotifications1700000000001';

    public async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'course_pending_review',
        'new_user_registered',
        'course_approved',
        'course_rejected',
        'enrollment_confirmed',
        'new_course_available',
        'course_status_changed',
        'new_enrollment'
      )
    `);

        await qr.query(`
      CREATE TABLE "notifications" (
        "id"         uuid                       NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid                       NOT NULL,
        "type"       "notification_type_enum"   NOT NULL,
        "title"      character varying          NOT NULL,
        "message"    text                       NOT NULL,
        "is_read"    boolean                    NOT NULL DEFAULT false,
        "meta"       jsonb,
        "created_at" TIMESTAMP                  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

        await qr.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`);
        await qr.query(`CREATE INDEX "IDX_notifications_user_unread" ON "notifications" ("user_id", "is_read") WHERE is_read = false`);
    }

    public async down(qr: QueryRunner): Promise<void> {
        await qr.query(`DROP TABLE "notifications"`);
        await qr.query(`DROP TYPE "notification_type_enum"`);
    }
}