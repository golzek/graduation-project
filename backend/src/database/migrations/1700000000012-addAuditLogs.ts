import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogs1700000000012 implements MigrationInterface {
    name = 'AddAuditLogs1700000000012';

    public async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);

        await qr.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum'
                ) THEN
                    CREATE TYPE "audit_action_enum" AS ENUM (
                        'CREATE', 'UPDATE', 'DELETE',
                        'LOGIN', 'LOGOUT', 'BAN', 'UNBAN'
                    );
                END IF;
            END$$;
        `);

        await qr.query(`
            CREATE TABLE IF NOT EXISTS "audit_logs" (
                                                        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
                "actorId"     uuid,
                "actorEmail"  character varying,
                "actorRole"   character varying,
                "action"      "audit_action_enum" NOT NULL,
                "entity"      character varying NOT NULL,
                "entityId"    character varying,
                "method"      character varying NOT NULL,
                "path"        character varying NOT NULL,
                "ip"          character varying,
                "payload"     jsonb,
                "response"    jsonb,
                "statusCode"  integer,
                "isError"     boolean NOT NULL DEFAULT false,
                "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
                )
        `);

        await qr.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_audit_actorId'
                ) THEN
                    CREATE INDEX "IDX_audit_actorId"
                    ON "audit_logs" ("actorId");
                END IF;
            END$$;
        `);

        await qr.query(`
            CREATE INDEX IF NOT EXISTS "IDX_audit_entity"
                ON "audit_logs" ("entity", "entityId")
        `);

        await qr.query(`
            CREATE INDEX IF NOT EXISTS "IDX_audit_createdAt"
                ON "audit_logs" ("createdAt" DESC)
        `);

        await qr.query(`
            CREATE INDEX IF NOT EXISTS "IDX_audit_action"
            ON "audit_logs" ("action")
        `);
    }

    public async down(qr: QueryRunner): Promise<void> {
        await qr.query(`DROP TABLE IF EXISTS "audit_logs"`);

        await qr.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_type WHERE typname = 'audit_action_enum'
                ) THEN
                    DROP TYPE "audit_action_enum";
                END IF;
            END$$;
        `);
    }
}