import {
    Controller, Get, Post, Delete, Patch,
    Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { QaService } from './qa.service';
import { CreateQuestionDto, CreateAnswerDto, UpdateQuestionDto } from './qa.dto';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('qa')
@Controller('qa')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class QaController {
    constructor(private readonly svc: QaService) {}

    @Get('lesson/:lessonId')
    @ApiOperation({
        summary: 'Питання до уроку',
        description: 'Студент бачить лише свої питання. Викладач і адмін — всі питання до уроку.',
    })
    @ApiParam({ name: 'lessonId', description: 'UUID уроку' })
    @ApiResponse({ status: 200, description: 'Список питань з відповідями' })
    getByLesson(@Param('lessonId') lessonId: string, @CurrentUser() u: any) {
        return this.svc.getByLesson(lessonId, u?.id);
    }

    @Post('questions')
    @ApiOperation({ summary: 'Задати питання до уроку' })
    @ApiBody({ type: CreateQuestionDto })
    @ApiResponse({ status: 201, description: 'Питання створено' })
    @ApiResponse({ status: 403, description: 'Потрібен запис на курс' })
    createQuestion(@Body() dto: CreateQuestionDto, @CurrentUser() u: any) {
        return this.svc.createQuestion(dto, u);
    }

    @Patch('questions/:id')
    @ApiOperation({ summary: 'Редагувати своє питання' })
    @ApiParam({ name: 'id', description: 'UUID питання' })
    @ApiBody({ type: UpdateQuestionDto })
    @ApiResponse({ status: 200, description: 'Питання оновлено' })
    @ApiResponse({ status: 403, description: 'Можна редагувати лише своє питання' })
    updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto, @CurrentUser() u: any) {
        return this.svc.updateQuestion(id, dto, u);
    }

    @Delete('questions/:id')
    @ApiOperation({ summary: 'Видалити питання', description: 'Студент видаляє лише своє; викладач і адмін — будь-яке' })
    @ApiParam({ name: 'id', description: 'UUID питання' })
    @ApiResponse({ status: 200, description: 'Питання видалено' })
    deleteQuestion(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.deleteQuestion(id, u);
    }

    @Post('answers')
    @ApiOperation({
        summary: 'Відповісти на питання',
        description: 'Доступно лише викладачу курсу або адміну',
    })
    @ApiBody({ type: CreateAnswerDto })
    @ApiResponse({ status: 201, description: 'Відповідь додано; студенту надходить сповіщення' })
    @ApiResponse({ status: 403, description: 'Лише викладач курсу або адмін може відповідати' })
    createAnswer(@Body() dto: CreateAnswerDto, @CurrentUser() u: any) {
        return this.svc.createAnswer(dto, u);
    }

    @Delete('answers/:id')
    @ApiOperation({ summary: 'Видалити відповідь' })
    @ApiParam({ name: 'id', description: 'UUID відповіді' })
    @ApiResponse({ status: 200, description: 'Відповідь видалено' })
    deleteAnswer(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.deleteAnswer(id, u);
    }
}