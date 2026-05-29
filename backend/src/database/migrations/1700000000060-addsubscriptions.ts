import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptions1700000000060 implements MigrationInterface {
    public async up(runner: QueryRunner): Promise<void> {
        await runner.query(`
            CREATE TYPE "subscriptions_plan_enum"   AS ENUM ('monthly', 'annual');
            CREATE TYPE "subscriptions_status_enum" AS ENUM ('active', 'expired', 'cancelled');
        `);

        await runner.query(`
            CREATE TABLE "subscriptions" (
                "id"          uuid        NOT NULL DEFAULT uuid_generate_v4(),
                "user_id"     uuid        NOT NULL,
                "plan"        "subscriptions_plan_enum"   NOT NULL DEFAULT 'monthly',
                "status"      "subscriptions_status_enum" NOT NULL DEFAULT 'active',
                "paid_price"  numeric(8,2) NOT NULL,
                "order_id"    character varying,
                "started_at"  TIMESTAMP   NOT NULL DEFAULT now(),
                "expires_at"  TIMESTAMPTZ NOT NULL,
                "cancelled_at" boolean    NOT NULL DEFAULT false,
                CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_subscriptions_user"
                    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        await runner.query(`CREATE INDEX "IDX_subscriptions_user_id"        ON "subscriptions" ("user_id")`);
        await runner.query(`CREATE INDEX "IDX_subscriptions_status_expires"  ON "subscriptions" ("status", "expires_at")`);
    }

    public async down(runner: QueryRunner): Promise<void> {
        await runner.query(`DROP TABLE "subscriptions"`);
        await runner.query(`DROP TYPE "subscriptions_status_enum"`);
        await runner.query(`DROP TYPE "subscriptions_plan_enum"`);
    }
}