import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Certificate } from './certificate.entity';
import { Course, Enrollment, Progress } from '../courses/course.entity';
import { CertificateController } from './certificate.controller';
import { CertificateService } from './certificate.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, Course, Enrollment, Progress]), NotificationModule],
  controllers: [CertificateController],
  providers: [CertificateService],
})
export class CertificateModule {}