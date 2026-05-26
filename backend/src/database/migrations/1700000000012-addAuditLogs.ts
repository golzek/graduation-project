import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogs1700000000012 implements MigrationInterface {
    name = 'AddAuditLogs1700000000012';

    public async up(qr: QueryRunner): Promise<void> {
        await qr.query(`
            CREATE TYPE "audit_action_enum" AS ENUM (
                'CREATE', 'UPDATE', 'DELETE',
                'LOGIN', 'LOGOUT', 'BAN', 'UNBAN'
            )
        `);

        await qr.query(`
            CREATE TABLE "audit_logs" (
                "id"          uuid                  NOT NULL DEFAULT uuid_generate_v4(),
                "actorId"     uuid,
                "actorEmail"  character varying,
                "actorRole"   character varying,
                "action"      "audit_action_enum"   NOT NULL,
                "entity"      character varying     NOT NULL,
                "entityId"    character varying,
                "method"      character varying     NOT NULL,
                "path"        character varying     NOT NULL,
                "ip"          character varying,
                "payload"     jsonb,
                "response"    jsonb,
                "statusCode"  integer,
                "isError"     boolean               NOT NULL DEFAULT false,
                "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);

        await qr.query(`CREATE INDEX "IDX_audit_actorId"   ON "audit_logs" ("actorId")`);
        await qr.query(`CREATE INDEX "IDX_audit_entity"    ON "audit_logs" ("entity", "entityId")`);
        await qr.query(`CREATE INDEX "IDX_audit_createdAt" ON "audit_logs" ("createdAt" DESC)`);
        await qr.query(`CREATE INDEX "IDX_audit_action"    ON "audit_logs" ("action")`);
    }

    public async down(qr: QueryRunner): Promise<void> {
        await qr.query(`DROP TABLE IF EXISTS "audit_logs"`);
        await qr.query(`DROP TYPE  IF EXISTS "audit_action_enum"`);
    }
}