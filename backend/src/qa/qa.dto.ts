import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateQuestionDto {
    @IsUUID()
    lessonId: string;

    @IsString()
    @MinLength(5)
    body: string;
}

export class CreateAnswerDto {
    @IsUUID()
    questionId: string;

    @IsString()
    @MinLength(2)
    body: string;
}

export class UpdateQuestionDto {
    @IsString()
    @MinLength(5)
    body: string;
}