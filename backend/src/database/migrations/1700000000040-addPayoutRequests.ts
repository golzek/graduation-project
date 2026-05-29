import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayoutRequests1700000000040 implements MigrationInterface {
    name = 'AddPayoutRequests1700000000040';

    async up(runner: QueryRunner) {
        await runner.query(`
      CREATE TYPE payout_status_enum AS ENUM ('pending', 'approved', 'rejected', 'paid');

      CREATE TABLE payout_requests (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount           NUMERIC(10,2) NOT NULL,
        "paymentDetails" TEXT         NOT NULL,
        status           payout_status_enum NOT NULL DEFAULT 'pending',
        "adminComment"   TEXT,
        "processedBy"    UUID,
        "processedAt"    TIMESTAMPTZ,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_payout_teacher ON payout_requests(teacher_id);
      CREATE INDEX idx_payout_status  ON payout_requests(status);
    `);
    }

    async down(runner: QueryRunner) {
        await runner.query(`
      DROP TABLE IF EXISTS payout_requests;
      DROP TYPE IF EXISTS payout_status_enum;
    `);
    }
}