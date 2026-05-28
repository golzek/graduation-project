import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferrals1700000000030 implements MigrationInterface {
    name = 'AddReferrals1700000000030';

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "referrals" (
                "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
                "referrerId" UUID         NOT NULL,
                "refereeId"  UUID         NOT NULL,
                "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now(),
                CONSTRAINT "PK_referrals"          PRIMARY KEY ("id"),
                CONSTRAINT "UQ_referrals_referee"  UNIQUE ("refereeId"),
                CONSTRAINT "FK_referrals_referrer" FOREIGN KEY ("referrerId")
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_referrals_referee"  FOREIGN KEY ("refereeId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_referrals_referrerId" ON "referrals" ("referrerId")
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_referrals_referrerId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "referrals"`);
    }
}