import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWishlists1700000000010 implements MigrationInterface {
    name = 'AddWishlists1700000000010';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "wishlists" (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"    uuid              NOT NULL,
        "course_id"  uuid              NOT NULL,
        "added_at"   TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_wishlists"             PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wishlists_user_course" UNIQUE ("user_id", "course_id"),
        CONSTRAINT "FK_wishlists_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_wishlists_course"
          FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE
      )
    `);
        await queryRunner.query(
            `CREATE INDEX "IDX_wishlists_user_id" ON "wishlists" ("user_id")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_wishlists_user_id"`);
        await queryRunner.query(`DROP TABLE "wishlists"`);
    }
}