import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQaTables1700000000050 implements MigrationInterface {
    name = 'AddQaTables1700000000050';

    public async up(runner: QueryRunner): Promise<void> {
        await runner.query(`
      CREATE TABLE "qa_questions" (
        "id"           uuid         NOT NULL DEFAULT uuid_generate_v4(),
        "body"         text         NOT NULL,
        "lesson_id"    uuid         NOT NULL,
        "author_id"    uuid         NOT NULL,
        "answer_count" integer      NOT NULL DEFAULT 0,
        "created_at"   TIMESTAMP    NOT NULL DEFAULT now(),
        "updated_at"   TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_qa_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_qa_questions_lesson"
          FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_qa_questions_author"
          FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

        await runner.query(`
      CREATE TABLE "qa_answers" (
        "id"            uuid      NOT NULL DEFAULT uuid_generate_v4(),
        "body"          text      NOT NULL,
        "question_id"   uuid      NOT NULL,
        "author_id"     uuid      NOT NULL,
        "is_instructor" boolean   NOT NULL DEFAULT false,
        "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_qa_answers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_qa_answers_question"
          FOREIGN KEY ("question_id") REFERENCES "qa_questions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_qa_answers_author"
          FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    }

    public async down(runner: QueryRunner): Promise<void> {
        await runner.query(`DROP TABLE "qa_answers"`);
        await runner.query(`DROP TABLE "qa_questions"`);
    }
}