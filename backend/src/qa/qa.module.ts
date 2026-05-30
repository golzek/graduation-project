import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaQuestion, QaAnswer } from './qa.entity';
import { QaService } from './qa.service';
import { QaController } from './qa.controller';
import { Course } from '../courses/course.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([QaQuestion, QaAnswer, Course]),
        NotificationModule,
    ],
    providers: [QaService],
    controllers: [QaController],
})
export class QaModule {}