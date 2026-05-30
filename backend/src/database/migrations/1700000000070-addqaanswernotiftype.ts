import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQaAnswerNotifType1700000000070 implements MigrationInterface {
    name = 'AddQaAnswerNotifType1700000000070';

    public async up(runner: QueryRunner): Promise<void> {
        await runner.query(`ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS 'new_qa_answer'`);
    }

    public async down(_runner: QueryRunner): Promise<void> {
    }
}