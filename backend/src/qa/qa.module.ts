import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QaQuestion, QaAnswer } from './qa.entity';
import { QaService } from './qa.service';
import { QaController } from './qa.controller';

@Module({
    imports: [TypeOrmModule.forFeature([QaQuestion, QaAnswer])],
    providers: [QaService],
    controllers: [QaController],
})
export class QaModule {}