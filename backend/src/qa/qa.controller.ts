import {
    Controller, Get, Post, Delete, Patch,
    Body, Param, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { QaService } from './qa.service';
import { CreateQuestionDto, CreateAnswerDto, UpdateQuestionDto } from './qa.dto';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('qa')
@Controller('qa')
export class QaController {
    constructor(private readonly svc: QaService) {}

    @Get('lesson/:lessonId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Список питань до уроку (студент — тільки свої; викладач — всі)' })
    getByLesson(@Param('lessonId') lessonId: string, @CurrentUser() u: any) {
        return this.svc.getByLesson(lessonId, u?.id);
    }

    @Post('questions')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Задати питання' })
    createQuestion(@Body() dto: CreateQuestionDto, @CurrentUser() u: any) {
        return this.svc.createQuestion(dto, u);
    }

    @Patch('questions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Редагувати своє питання' })
    updateQuestion(
        @Param('id') id: string,
        @Body() dto: UpdateQuestionDto,
        @CurrentUser() u: any,
    ) {
        return this.svc.updateQuestion(id, dto, u);
    }

    @Delete('questions/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Видалити питання' })
    deleteQuestion(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.deleteQuestion(id, u);
    }

    @Post('answers')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Відповісти на питання (тільки викладач курсу або адмін)' })
    createAnswer(@Body() dto: CreateAnswerDto, @CurrentUser() u: any) {
        return this.svc.createAnswer(dto, u);
    }

    @Delete('answers/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Видалити відповідь' })
    deleteAnswer(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.deleteAnswer(id, u);
    }
}