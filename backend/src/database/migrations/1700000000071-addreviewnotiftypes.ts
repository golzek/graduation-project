import { MigrationInterface, QueryRunner } from 'typeorm';

export class Addreviewnotiftypes1700000000071 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE notification_type_enum
            ADD VALUE IF NOT EXISTS 'new_review_pending';
        `);
        await queryRunner.query(`
            ALTER TYPE notification_type_enum
            ADD VALUE IF NOT EXISTS 'review_approved';
        `);
        await queryRunner.query(`
            ALTER TYPE notification_type_enum
            ADD VALUE IF NOT EXISTS 'new_review_on_course';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}