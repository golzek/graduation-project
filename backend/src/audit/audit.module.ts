import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './interceptor/audit.interceptor';

@Module({
    imports: [TypeOrmModule.forFeature([AuditLog])],
    providers: [AuditService, AuditInterceptor],
    controllers: [AuditController],
    exports: [AuditInterceptor, AuditService],
})
export class AuditModule {}