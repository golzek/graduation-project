import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(qr: QueryRunner): Promise<void> {
    // ENUM типи
    await qr.query(`CREATE TYPE "user_role_enum" AS ENUM ('student','teacher','admin','moderator')`);
    await qr.query(`CREATE TYPE "course_status_enum" AS ENUM ('draft','published','archived')`);
    await qr.query(`CREATE TYPE "course_level_enum" AS ENUM ('beginner','intermediate','advanced')`);
    await qr.query(`CREATE TYPE "lesson_type_enum" AS ENUM ('video','text','quiz')`);

    // users
    await qr.query(`
      CREATE TABLE "users" (
        "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "email"       character varying NOT NULL,
        "password"    character varying NOT NULL,
        "name"        character varying NOT NULL,
        "role"        "user_role_enum"  NOT NULL DEFAULT 'student',
        "avatar_url"  character varying,
        "is_active"   boolean           NOT NULL DEFAULT true,
        "created_at"  TIMESTAMP         NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // courses
    await qr.query(`
      CREATE TABLE "courses" (
        "id"           uuid                  NOT NULL DEFAULT uuid_generate_v4(),
        "title"        character varying     NOT NULL,
        "description"  text                  NOT NULL,
        "price"        numeric(8,2)          NOT NULL DEFAULT 0,
        "thumbnail_url" character varying,
        "status"       "course_status_enum"  NOT NULL DEFAULT 'draft',
        "level"        "course_level_enum"   NOT NULL DEFAULT 'beginner',
        "category"     character varying,
        "author_id"    uuid                  NOT NULL,
        "created_at"   TIMESTAMP             NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP             NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_courses_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // modules
    await qr.query(`
      CREATE TABLE "modules" (
        "id"          uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "title"       character varying NOT NULL,
        "order_index" integer           NOT NULL DEFAULT 0,
        "course_id"   uuid              NOT NULL,
        CONSTRAINT "PK_modules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_modules_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    // lessons
    await qr.query(`
      CREATE TABLE "lessons" (
        "id"            uuid                NOT NULL DEFAULT uuid_generate_v4(),
        "title"         character varying   NOT NULL,
        "type"          "lesson_type_enum"  NOT NULL DEFAULT 'video',
        "content_url"   character varying,
        "text_content"  text,
        "duration_sec"  integer             NOT NULL DEFAULT 0,
        "order_index"   integer             NOT NULL DEFAULT 0,
        "is_free"       boolean             NOT NULL DEFAULT false,
        "module_id"     uuid                NOT NULL,
        CONSTRAINT "PK_lessons" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lessons_module" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE
      )
    `);

    // enrollments
    await qr.query(`
      CREATE TABLE "enrollments" (
        "id"          uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"     uuid         NOT NULL,
        "course_id"   uuid         NOT NULL,
        "paid_price"  numeric(8,2) NOT NULL DEFAULT 0,
        "enrolled_at" TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_enrollments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_enrollments_user_course" UNIQUE ("user_id","course_id"),
        CONSTRAINT "FK_enrollments_user"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")   ON DELETE CASCADE,
        CONSTRAINT "FK_enrollments_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    // progress
    await qr.query(`
      CREATE TABLE "progress" (
        "id"          uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"     uuid      NOT NULL,
        "lesson_id"   uuid      NOT NULL,
        "completed"   boolean   NOT NULL DEFAULT false,
        "watched_sec" integer   NOT NULL DEFAULT 0,
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_progress" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_progress_user_lesson" UNIQUE ("user_id","lesson_id"),
        CONSTRAINT "FK_progress_user"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")   ON DELETE CASCADE,
        CONSTRAINT "FK_progress_lesson" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE
      )
    `);

    // certificates
    await qr.query(`
      CREATE TABLE "certificates" (
        "id"           uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "verify_code"  character varying NOT NULL,
        "user_id"      uuid              NOT NULL,
        "course_id"    uuid              NOT NULL,
        "pdf_url"      character varying,
        "issued_at"    TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_certificates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_certificates_code" UNIQUE ("verify_code"),
        CONSTRAINT "FK_certificates_user"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")   ON DELETE CASCADE,
        CONSTRAINT "FK_certificates_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    // reviews
    await qr.query(`
      CREATE TABLE "reviews" (
        "id"          uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "rating"      integer   NOT NULL,
        "body"        text,
        "is_approved" boolean   NOT NULL DEFAULT false,
        "user_id"     uuid      NOT NULL,
        "course_id"   uuid      NOT NULL,
        "created_at"  TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"  TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reviews_user_course" UNIQUE ("user_id","course_id"),
        CONSTRAINT "FK_reviews_user"   FOREIGN KEY ("user_id")   REFERENCES "users"("id")   ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);

    // Індекси для швидкого пошуку
    await qr.query(`CREATE INDEX "IDX_courses_status"   ON "courses"("status")`);
    await qr.query(`CREATE INDEX "IDX_courses_category" ON "courses"("category")`);
    await qr.query(`CREATE INDEX "IDX_courses_author"   ON "courses"("author_id")`);
    await qr.query(`CREATE INDEX "IDX_lessons_module"   ON "lessons"("module_id")`);
    await qr.query(`CREATE INDEX "IDX_progress_user"    ON "progress"("user_id")`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS "reviews"      CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "certificates" CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "progress"     CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "enrollments"  CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "lessons"      CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "modules"      CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "courses"      CASCADE`);
    await qr.query(`DROP TABLE IF EXISTS "users"        CASCADE`);
    await qr.query(`DROP TYPE IF EXISTS "lesson_type_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "course_level_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "course_status_enum"`);
    await qr.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
