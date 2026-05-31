import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuestionDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID уроку до якого ставиться питання' })
    @IsUUID() lessonId: string;

    @ApiProperty({ example: 'Чим відрізняється interface від type в TypeScript?', description: 'Текст питання' })
    @IsString() text: string;
}

export class UpdateQuestionDto {
    @ApiPropertyOptional({ example: 'Чим відрізняється interface від type alias?', description: 'Новий текст питання' })
    @IsOptional() @IsString() text?: string;
}

export class CreateAnswerDto {
    @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440001', description: 'ID питання на яке дається відповідь' })
    @IsUUID() questionId: string;

    @ApiProperty({ example: 'Interface підтримує declaration merging, а type — ні. Для об\'єктів зазвичай використовують interface.', description: 'Текст відповіді' })
    @IsString() text: string;
}